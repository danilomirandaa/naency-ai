import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { ENRICH_BATCH_SIZE, createAnthropicEnricher } = await import('./enrich');
const { getAiConfig } = await import('./config');

const categories = [
  { id: 'mercado', name: 'Mercado', kind: 'expense' as const, parentName: null },
  { id: 'delivery', name: 'Delivery', kind: 'expense' as const, parentName: 'Alimentação' },
  { id: 'salario', name: 'Salário', kind: 'income' as const, parentName: null },
];

function fakeClient(respond: (rows: { id: string }[]) => unknown, stopReason = 'end_turn') {
  const parse = vi.fn(async (request: { messages: { content: string }[] }) => {
    const rows = JSON.parse(request.messages[0]?.content.split('\n').slice(1).join('\n') ?? '[]') as { id: string }[];
    return {
      stop_reason: stopReason,
      usage: { input_tokens: 1000, output_tokens: 200 },
      parsed_output: respond(rows),
    };
  });
  return { client: { messages: { parse } } as never, parse };
}

describe('getAiConfig', () => {
  it('liga só com chave e usa o modelo padrão ou o da variável', () => {
    expect(getAiConfig({})).toEqual({ enabled: false, models: { enrich: 'claude-opus-5' } });
    expect(getAiConfig({ ANTHROPIC_API_KEY: ' sk ', AI_MODEL_ENRICH: 'claude-sonnet-5' })).toEqual({
      enabled: true,
      models: { enrich: 'claude-sonnet-5' },
    });
  });
});

describe('createAnthropicEnricher', () => {
  it('envia categorias em cache no system e valida as sugestões', async () => {
    const { client, parse } = fakeClient(() => ({
      suggestions: [
        { id: 'r1', clean_name: ' iFood ', category_id: 'delivery' },
        // Categoria de receita numa saída: descartada.
        { id: 'r2', clean_name: 'Padaria', category_id: 'salario' },
        // Id inventado: descartado.
        { id: 'r3', clean_name: '', category_id: 'inventada' },
        // Linha que não foi enviada: ignorada.
        { id: 'xx', clean_name: 'Fantasma', category_id: 'mercado' },
      ],
    }));
    const enrich = createAnthropicEnricher(client, 'claude-opus-5');
    const result = await enrich({
      rows: [
        { id: 'r1', description: 'IFD*IFOOD.COM AGENCIA', amountCents: -4590 },
        { id: 'r2', description: 'PADARIA SAO JOAO', amountCents: -1200 },
        { id: 'r3', description: 'PIX RECEBIDO', amountCents: 5000 },
      ],
      categories,
    });

    expect(result.suggestions).toEqual([
      { id: 'r1', cleanName: 'iFood', categoryId: 'delivery' },
      { id: 'r2', cleanName: 'Padaria', categoryId: null },
      { id: 'r3', cleanName: 'PIX RECEBIDO', categoryId: null },
    ]);
    expect(result.usage).toEqual([{ model: 'claude-opus-5', inputTokens: 1000, outputTokens: 200 }]);

    const request = parse.mock.calls[0]?.[0] as unknown as Record<string, unknown>;
    expect(request).toMatchObject({ model: 'claude-opus-5', max_tokens: 16000 });
    expect((request.system as { cache_control?: unknown }[])[1]).toMatchObject({ cache_control: { type: 'ephemeral' } });
    expect(JSON.stringify(request.system)).toContain('Alimentação › Delivery');
    expect(request.output_config).toHaveProperty('format');
  });

  it('divide em lotes', async () => {
    const { client, parse } = fakeClient((rows) => ({
      suggestions: rows.map((row) => ({ id: row.id, clean_name: 'X', category_id: null })),
    }));
    const rows = Array.from({ length: ENRICH_BATCH_SIZE + 5 }, (_, index) => ({
      id: `r${index}`,
      description: 'Compra',
      amountCents: -100,
    }));
    const result = await createAnthropicEnricher(client, 'm')({ rows, categories });
    expect(parse).toHaveBeenCalledTimes(2);
    expect(result.suggestions).toHaveLength(ENRICH_BATCH_SIZE + 5);
  });

  it('recusa ou resposta cortada vira erro', async () => {
    const { client } = fakeClient(() => null, 'refusal');
    await expect(
      createAnthropicEnricher(client, 'm')({ rows: [{ id: 'a', description: 'x', amountCents: -1 }], categories }),
    ).rejects.toThrow(/refusal/);
  });
});
