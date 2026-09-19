# Importação e onboarding

Como a pessoa sai do zero e chega com os dados dos bancos dela no Naency, e como os
extratos são lidos. Entidades citadas estão em [domínio](./domain.md).

## Princípios

- **Entendível**: cada passo diz o que vai acontecer e por quê, em linguagem de gente
  ("Vamos buscar seus lançamentos do Nubank"), sem termos técnicos.
- **Nada entra sem revisão**: a AI sugere, a pessoa confirma.
- **Retomável e pulável**: dá para sair no meio e voltar, e dá para pular etapas.
- **Vários bancos e formatos**: cada conta importa seus arquivos (PDF, CSV ou OFX), em qualquer momento, não só no onboarding.

## Onboarding

| # | Tela | O que acontece |
| --- | --- | --- |
| 1 | Login | Google ou link mágico por e-mail (Supabase Auth) |
| 2 | Criar espaço | Nome do espaço ("Finanças da casa"). Moeda BRL |
| 3 | Convidar pessoas (opcional) | E-mail + papel (editor ou leitor). Pode pular e convidar depois |
| 4 | Quais bancos você usa? | Grade com as instituições do catálogo + "Outro banco". Para cada uma, marcar conta corrente, poupança/investimento e/ou cartão (com dia de fechamento e vencimento) |
| 5 | Importar | Por conta: instruções de exportação daquele banco (`institutions.export_instructions`), upload de um ou mais arquivos, progresso por arquivo |
| 6 | Revisar | Resumo por arquivo ("142 lançamentos · 12 pedem atenção") e tabela editável |
| 7 | Pronto | Vai para o dashboard. Um checklist "Complete sua configuração" fica visível enquanto faltar algo |

- A etapa atual fica em `workspaces.onboarding_step`.
- Quem entra por **convite** não passa pelo onboarding.
- **Importar** também fica disponível a qualquer momento no header e na página de cada conta.

## Pipeline

```
upload ─► detectar formato ─► ler ─► normalizar ─► memória de categorização
      ─► enriquecer com AI ─► deduplicar ─► revisão ─► commit
```

### Por formato

| Formato | Leitura | Uso de AI |
| --- | --- | --- |
| **OFX** | Parser determinístico | Só enriquecimento |
| **CSV de layout conhecido** (ex.: Nubank conta, Nubank cartão) | Layout reconhecido pelo cabeçalho | Só enriquecimento |
| **CSV desconhecido** | A AI recebe o cabeçalho e ~20 linhas e devolve o **mapeamento de colunas** (data, valor, descrição, formato de data e de número); o código lê o arquivo inteiro com esse mapeamento | Mapeamento + enriquecimento |
| **PDF** | A AI lê o documento e devolve os lançamentos em **saída estruturada validada por Zod** | Extração + enriquecimento |

Layouts reconhecidos e mapeamentos confirmados viram parsers/regras salvos, e a
próxima importação do mesmo banco sai mais barata.

### Etapas

1. **Upload**: o arquivo vai para um bucket privado por URL assinada, e cria-se um
   `import_batch` com status `uploaded`.
2. **Detecção**: formato (extensão + conteúdo) e tipo de documento (extrato ou
   fatura de cartão), além do período coberto.
3. **Leitura e normalização**: cada linha vira data (`date`), valor em centavos com
   sinal e descrição original, gravados em `import_rows.parsed`.
   - **Fatura de cartão**: se a maioria das linhas vier positiva, o arquivo usa
     "compra = positivo" e o sinal é invertido (`normalizeCardSigns`).
   - **Coluna "Parcela"** ("3 de 12") vira `installment_number`/`installment_total`.
   - **"Pagamento de fatura"** dentro da fatura é o pagamento da anterior: a linha
     entra **desmarcada**, com selo na revisão. Pagar fatura é transferência, feita
     em "Pagar fatura" ([domínio](./domain.md)).
   - **Toda a fatura vai para a mesma fatura**: o arquivo é de um ciclo só, e a
     fatura usada é a do lançamento mais recente. Sem isso, uma parcela com a data
     da compra original (junho) cairia na fatura de junho, e não na que está sendo
     importada.
4. **Memória de categorização**: `categorization_rules` resolve o que já é conhecido.
5. **Enriquecimento com AI**, só para as linhas não resolvidas:
   - nome limpo (`PAG*JOSEDASILVA` → `José da Silva`);
   - categoria, escolhida **apenas** entre as categorias do espaço;
   - tipo (receita, despesa, transferência);
   - parcela (`PARC 03/10` → parcela 3 de 10);
   - pagamento de fatura e transferência entre contas do próprio espaço;
   - confiança de cada sugestão.
6. **Deduplicação**: pelo `fingerprint` e por sobreposição com lançamentos existentes
   da mesma conta (mesmo valor, data ±2 dias). Duplicatas vêm marcadas como `skip`.
   Em **cartão**, a comparação é só com o que já está **na mesma fatura**: a parcela
   carrega a data da compra original, então a parcela 4 de 12 tem data e valor iguais
   aos da 1 de 12, que veio numa fatura anterior, e seria descartada à toa.
7. **Revisão**: tabela com filtros ("pedem atenção", "duplicadas"), edição em massa de
   categoria, e opção "lembrar para os próximos" ao corrigir.
8. **Commit**: numa transação única, cria os lançamentos, liga transferências,
   parcelas e faturas, grava as regras aprendidas, registra no `activity_log` e marca o
   batch como `completed`.

### Execução assíncrona na Vercel

- O processamento roda **fora da requisição de upload** (`after()` do Next ou uma
  função dedicada). A tela acompanha o status com `refetchInterval` do TanStack Query,
  ativo só enquanto o batch está em `processing`.
- PDFs longos são divididos em faixas de páginas, processadas em sequência.
- Se o limite de duração de função da Vercel não bastar, adotar uma fila (ex.: Inngest).
  Validar na Fase 3 com arquivos reais.

## Módulo de AI

Fica em `server/ai/`, com `'server-only'`. O resto do sistema só conhece a interface
das tarefas, nunca o SDK.

| Tarefa | Entrada | Saída (Zod) | Modelo (env) |
| --- | --- | --- | --- |
| `extractStatement` | PDF (bloco `document`) | lançamentos, período, tipo de documento | `AI_MODEL_EXTRACT` |
| `mapCsvColumns` | cabeçalho + amostra de linhas | mapeamento de colunas e formatos | `AI_MODEL_EXTRACT` |
| `enrichRows` | linhas normalizadas + categorias e contas do espaço | nome limpo, categoria, tipo, parcela, transferência, confiança | `AI_MODEL_ENRICH` |

Implementação:

- SDK oficial `@anthropic-ai/sdk`. Modelo padrão `claude-opus-5`, trocável por variável
  de ambiente **por tarefa**.
- Thinking adaptativo. O esforço (`output_config.effort`) é definido por tarefa e
  ajustado pelo eval.
- **Saída estruturada** com `client.messages.parse` + schema Zod. Resposta fora do
  schema é erro, nunca é aceita "no chute".
- **Cache de prompt** no system prompt e na lista de categorias, que se repetem entre chamadas.
- Streaming para PDFs grandes.
- Fallback em caso de recusa do modelo habilitado.
- Toda chamada grava um `ai_usage_events` com tokens e custo.
- Importação de histórico antigo (não urgente) pode usar a Batch API, com 50% de desconto.
- **Testes nunca chamam a API**: usam fixtures (ver [testes](./testing.md)).

## Custos estimados

Preços da API em US$ por milhão de tokens (entrada / saída): Opus 5 $5 / $25,
Sonnet 5 $2 / $10, Haiku 4.5 $1 / $5. Premissas: extrato PDF de ~5 páginas com ~150
lançamentos (~15 mil tokens de entrada, ~10 mil de saída); CSV/OFX lido por código com
a AI só enriquecendo; câmbio de R$ 5,50.

| Uso | Opus 5 | Sonnet 5 | Haiku 4.5 |
| --- | --- | --- | --- |
| Ler 1 extrato/fatura em PDF | ~R$ 1,80 | ~R$ 0,70 | ~R$ 0,35 |
| Enriquecer 1 CSV/OFX (150 linhas) | ~R$ 0,70 | ~R$ 0,30 | ~R$ 0,15 |
| Categorizar 1 lançamento manual | ~R$ 0,05 | ~R$ 0,02 | ~R$ 0,01 |
| Mês típico (2 contas + 2 cartões em PDF) | ~R$ 7 | ~R$ 3 | ~R$ 1,50 |
| Onboarding com 12 meses de histórico (48 docs, uma vez) | ~R$ 88 | ~R$ 34 | ~R$ 17 |

São estimativas: o número de tokens por página varia entre bancos. Duas coisas
reduzem o custo com o tempo: a **memória de categorização** (lançamentos conhecidos não
chamam a AI) e **CSV/OFX** no lugar de PDF quando o banco oferece.

## Escolha do modelo (eval)

A escolha final de modelo por tarefa sai de medição, não de suposição.

- Amostras reais ficam em `.samples/`, **no `.gitignore`, nunca commitadas**: Nubank
  (conta e cartão), XP e pelo menos mais um banco, em PDF, CSV e OFX.
- Para cada amostra, um gabarito revisado à mão com os lançamentos esperados.
- O eval (`evals/import/`) compara `claude-opus-5` e `claude-sonnet-5` em:
  quantidade de lançamentos, data e valor exatos, acerto de categoria e custo por documento.
- O eval **não roda na CI** (custa dinheiro); roda sob demanda ao mudar prompt ou modelo.

## Privacidade

- Extratos ficam em bucket privado; o arquivo original é apagado automaticamente N
  dias após a importação (configurável em Configurações).
- A AI recebe só o necessário para a tarefa (para enriquecer, as linhas e as
  categorias; nunca dados de outros espaços).
- Chaves só no servidor.
- Antes do lançamento público, documentar a política de retenção de dados da API do
  provedor de AI e informar isso ao usuário na tela de importação.

## Estado atual (implementado)

- Leitura no navegador (`lib/import/decode.ts`) e parsers em `lib/import/` (OFX 1.x/2.x,
  CSV Nubank conta e cartão, CSV genérico por sinônimos de colunas).
- Revisão em `/importar?lote=<id>`: incluir/excluir, categoria por linha, "lembrar para
  os próximos" (cria regra `user`), duplicados exatos (impressão digital) e possíveis
  (mesmo valor em ±2 dias, fora por padrão).
- AI (`server/ai/`): `createAnthropicEnricher` usa `client.messages.parse` com saída
  estruturada (Zod), categorias no system com cache e lotes de 80 linhas. Só liga com
  `ANTHROPIC_API_KEY`; modelo por `AI_MODEL_ENRICH` (padrão `claude-opus-5`). Cada
  chamada grava `ai_usage_events`. Sugestões com categoria de outro tipo ou id
  inexistente são descartadas.
- Falta: PDF e CSV desconhecido com AI, e o eval com extratos reais em `.samples/`.

**Trabalho em segundo plano**: "Sugerir com AI" e "Importar" respondem na hora e
seguem rodando no servidor com `after()` (Next 16). O estado fica no lote
(`import_batches.job`, `job_error`), então dá para recarregar ou sair da página
sem perder nada. Quem acompanha é o `ImportJobsWatcher`, montado no layout do app
(não na tela de importação): ele faz polling enquanto houver `job` e, no fim,
mostra um toast, dispara notificação do navegador se a aba estiver em segundo
plano e alimenta o sino do header. Um lote aceita um trabalho por vez. Detalhes
em [componentes](./components.md#avisos-toast-e-sino) e
[arquitetura](./architecture.md#trabalho-depois-da-resposta).

**Execução na Vercel**