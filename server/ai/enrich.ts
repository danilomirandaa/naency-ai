import 'server-only';
import type Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

export type EnrichRow = { id: string; description: string; amountCents: number };
export type EnrichCategory = { id: string; name: string; kind: 'income' | 'expense'; parentName: string | null };
export type EnrichSuggestion = { id: string; cleanName: string; categoryId: string | null };
export type EnrichUsage = { model: string; inputTokens: number; outputTokens: number };

export type Enricher = (input: {
  rows: EnrichRow[];
  categories: EnrichCategory[];
}) => Promise<{ suggestions: EnrichSuggestion[]; usage: EnrichUsage[] }>;

/** Linhas por chamada: cabe folgado no limite de saída e mantém o custo previsível. */
export const ENRICH_BATCH_SIZE = 80;

const SuggestionsSchema = z.object({
  suggestions: z.array(
    z.object({
      id: z.string(),
      clean_name: z.string(),
      category_id: z.string().nullable(),
    }),
  ),
});

const SYSTEM_PROMPT = `Você organiza lançamentos de extratos bancários brasileiros para um app de finanças pessoais.
Para cada lançamento, devolva:
- clean_name: nome curto e legível do estabelecimento ou da pessoa, em pt-BR, sem códigos, datas, "PIX", "COMPRA NO DEBITO", números de parcela ou cidade. Ex.: "PAG*JOSEDASILVA" → "José da Silva"; "IFD*IFOOD.COM AGENCIA" → "iFood".
- category_id: o id da categoria mais provável da lista, respeitando o tipo (valor negativo = despesa, positivo = receita). Prefira a subcategoria quando ela for clara. Use null quando não houver categoria adequada ou quando não tiver confiança.
Não invente ids. Devolva exatamente um item por lançamento recebido, com o mesmo id.`;

function categoriesText(categories: EnrichCategory[]) {
  return JSON.stringify(
    categories.map((category) => ({
      id: category.id,
      tipo: category.kind === 'income' ? 'receita' : 'despesa',
      nome: category.parentName ? `${category.parentName} › ${category.name}` : category.name,
    })),
  );
}

/** Enriquecimento com a Claude API: nome limpo e categoria, validados contra a lista do espaço. */
export function createAnthropicEnricher(client: Pick<Anthropic, 'messages'>, model: string): Enricher {
  return async ({ rows, categories }) => {
    const kindById = new Map(categories.map((category) => [category.id, category.kind]));
    const suggestions: EnrichSuggestion[] = [];
    const usage: EnrichUsage[] = [];

    for (let start = 0; start < rows.length; start += ENRICH_BATCH_SIZE) {
      const batch = rows.slice(start, start + ENRICH_BATCH_SIZE);
      const response = await client.messages.parse({
        model,
        max_tokens: 16000,
        // A lista de categorias se repete entre lotes: vai no system, com cache.
        system: [
          { type: 'text', text: SYSTEM_PROMPT },
          {
            type: 'text',
            text: `Categorias disponíveis (JSON):\n${categoriesText(categories)}`,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: `Lançamentos (JSON):\n${JSON.stringify(
              batch.map((row) => ({ id: row.id, descricao: row.description, valor_centavos: row.amountCents })),
            )}`,
          },
        ],
        output_config: { format: zodOutputFormat(SuggestionsSchema) },
      });
      usage.push({ model, inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens });

      if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens' || !response.parsed_output) {
        throw new Error(`Sugestões da AI indisponíveis (${response.stop_reason ?? 'sem resposta'}).`);
      }

      const byId = new Map(batch.map((row) => [row.id, row]));
      for (const item of response.parsed_output.suggestions) {
        const row = byId.get(item.id);
        if (!row) {
          continue;
        }
        const expectedKind = row.amountCents > 0 ? 'income' : 'expense';
        // Só aceita categoria que existe e combina com entrada/saída.
        const categoryId = item.category_id && kindById.get(item.category_id) === expectedKind ? item.category_id : null;
        const cleanName = item.clean_name.trim().slice(0, 120);
        suggestions.push({ id: row.id, cleanName: cleanName || row.description, categoryId });
      }
    }
    return { suggestions, usage };
  };
}
