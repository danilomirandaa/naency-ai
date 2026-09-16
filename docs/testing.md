# Testes

> **Regra obrigatória.** Nenhuma feature é considerada pronta, nem sobe, sem os testes
> da sua camada passando na CI. Testes provam duas coisas: **a feature funciona** e
> **nada que já existia mudou**, inclusive visualmente.

## Definição de pronto

Uma entrega (feature, componente, correção) só está pronta quando tem:

1. Componentes com story ([componentes](./components.md)).
2. Testes de cada camada que ela toca (tabela abaixo).
3. Regressão visual sem diferença não intencional.
4. Docs atualizados, quando muda decisão, domínio ou fluxo.
5. CI verde.

## O que testar e com quê

| O que se testa | Ferramenta | Onde fica |
| --- | --- | --- |
| **Lógica pura**: `lib/money`, `lib/dates`, parsers OFX/CSV, `fingerprint` e deduplicação, atribuição de compra à fatura, geração de parcelas, regras de categorização | **Vitest** (unit) | `*.test.ts` ao lado do arquivo |
| **Componentes** (`ui`, `finance`, `layout`, `features/*/components`): renderiza, interage, é acessível | **Stories como testes**: `@storybook/addon-vitest` em modo browser (Playwright) + `play` functions + `@storybook/addon-a11y` | `*.stories.tsx` |
| **Nada mudou visualmente** | **Regressão visual**: screenshot de cada story em light e dark, comparado com o baseline commitado (Playwright `toHaveScreenshot` sobre as stories) | `tests/visual/` + baselines |
| **DAL e Server Actions**: regras de negócio e autorização por papel | **Vitest de integração** contra o Postgres real do **Supabase local** (Supabase CLI/Docker), com banco limpo a cada teste | `server/**/*.integration.test.ts` |
| **Fluxos críticos de ponta a ponta** | **Playwright E2E** contra o build de produção | `tests/e2e/` |
| **Qualidade da AI** | **Eval** com amostras reais (não roda na CI) | `evals/import/` |

### Mínimo por camada

- **Componente novo**: story para cada variante e estado (padrão, carregando, vazio,
  erro, desabilitado), `play` para cada interação relevante, a11y sem violações e
  screenshot em light e dark.
- **Regra de negócio**: teste unitário cobrindo o caminho feliz, os limites
  (fechamento de fatura no último dia do mês, parcela com centavo de arredondamento,
  mês de 28 dias) e os casos de erro.
- **Função do DAL**: um teste por papel (`admin`, `editor`, `viewer`) e um para quem
  não é membro, provando quem pode e quem não pode ler e escrever.
- **Parser de importação**: fixture de arquivo por banco e formato, com o resultado esperado.

### Fluxos E2E obrigatórios

1. Login → onboarding → importar CSV de amostra → revisar → confirmar → dashboard mostra os valores.
2. Admin convida membro como leitor → leitor entra, vê os mesmos dados e não consegue editar.
3. Lançar despesa no cartão → aparece na fatura certa → pagar fatura → saldo da conta e do cartão corretos.

## Regras

- **AI nunca é chamada em teste.** `server/ai` expõe uma interface por tarefa, e os
  testes usam respostas fixas (fixtures) gravadas a partir de chamadas reais.
- **Todo bug corrigido ganha um teste** que falha antes da correção.
- **Fixtures são sintéticas ou anonimizadas.** Extratos reais só existem em
  `.samples/` (no `.gitignore`) e só são usados pelo eval.
- **Baseline visual só muda de propósito.** Atualizar screenshot é um commit
  explícito e revisado, nunca efeito colateral.
- **Screenshots são gerados sempre no mesmo ambiente Linux da CI** (container), para
  que diferenças de fonte e sistema operacional não causem falso positivo.
- **`play` termina no estado inicial**: sem dialog, menu ou popover aberto e sem
  tema alterado. O screenshot visual é tirado depois do `play`, e overlays abertos
  deixam o resultado instável.
- **Nada de `sleep` em teste**: espere uma condição (`findBy…`, `waitFor`).
  Asserção de visibilidade logo após abrir algo animado usa `waitFor`, porque o
  elemento começa com opacidade 0.
- **Acessibilidade é erro, não aviso** (`a11y: { test: 'error' }` no Storybook).
  Corrija o componente ou a story; desligar a regra numa story exige comentário
  justificando.
- **Cobertura mínima de 90% de linhas** em `lib/`, `server/import/` e `server/dal/`,
  onde erro custa dinheiro ou vaza dados. Sem meta global.
- Teste não depende de ordem nem de rede externa, e não compartilha estado entre casos.

## CI

GitHub Actions a cada pull request. **Merge bloqueado** se qualquer etapa falhar.

```
typecheck ─► lint ─► unit ─► stories (+ a11y) ─► regressão visual
          ─► integração (Supabase local) ─► build ─► E2E
```

A Vercel publica produção só a partir da `main`; PRs geram preview.

## Regressão visual na prática

- `npm run build-storybook` gera `storybook-static/index.json`, e o teste tira um
  screenshot de **cada story em light e dark**. Story nova entra sozinha; para
  excluir uma, use a tag `skip-visual` (com justificativa).
- Baselines ficam em `tests/visual/__screenshots__/<plataforma>/`. **Só os de
  `linux/` são commitados**, porque a CI roda em Linux. Os de `darwin/` ficam fora
  do git e servem para conferir localmente antes do push.
- **Quando a mudança visual é intencional** (ex.: trocar ícones), confira as
  diferenças no relatório (`npx playwright show-report`) e regenere:
  - local: `npm run test:visual:update`;
  - baselines oficiais: rodar o workflow **CI** manualmente no GitHub com
    "Regenerar e commitar os baselines visuais" marcado. Ele gera os PNGs de
    Linux e faz o commit na branch.
- O workflow usa a imagem `mcr.microsoft.com/playwright` na mesma versão do
  `@playwright/test`. Ao atualizar o Playwright, atualize a tag em
  `.github/workflows/ci.yml` e regenere os baselines.

## Versões

`@storybook/addon-vitest` 10.6 exige **Vitest 4** (a versão mais recente do Vitest é a
5). Fixar `vitest@^4` e `@vitest/browser-playwright@^4` até o addon suportar a 5.

## Comandos

| Comando | O que roda |
| --- | --- |
| `npm run test` | Unit + stories (Vitest) |
| `npm run test:unit` | Só testes unitários |
| `npm run test:storybook` | Só stories como teste (render, `play`, a11y) |
| `npm run test:coverage` | Unit com cobertura (meta de 90% nas pastas críticas) |
| `npm run build-storybook && npm run test:visual` | Regressão visual |
| `npm run test:visual:update` | Regenera baselines locais (uso deliberado) |
| `npm run test:integration` | Integração contra Supabase local (Fase 0b) |
| `npm run test:e2e` | E2E com Playwright (Fase 3) |
