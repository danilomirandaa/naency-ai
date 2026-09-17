@AGENTS.md

## Naency

Controle financeiro pessoal (pt-BR). Antes de criar ou alterar UI, leia:

- `docs/components.md`: padrão de componentes (`components/ui`, Storybook)
- `docs/design/tokens.md`: tokens de cor e regras de uso
- `docs/design/legacy-theme.css`: paleta do projeto antigo, referência dos valores

Verificação: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build-storybook && npm run test:visual` (ver `docs/testing.md`).

## Regras obrigatórias

Não são recomendações. Nenhuma entrega está pronta sem elas.

1. **Componentização** ([docs/components.md](docs/components.md)): toda UI sai de
   componentes reutilizáveis nas camadas `components/ui`, `components/finance`,
   `components/layout` e `features/<feature>/components`, cada um com story.
   Páginas só compõem. UI duplicada vira componente na segunda ocorrência.
2. **Testes** ([docs/testing.md](docs/testing.md)): cada entrega tem os testes da
   camada que toca (unit, stories como teste, regressão visual, integração do DAL
   por papel, E2E), provando que funciona e que nada existente mudou.

3. **Excluir pede confirmação**: toda ação que apaga dado abre o `DeleteDialog`
   antes de executar ([docs/components.md](docs/components.md), regra 8).

**Definição de pronto**: componentes com story + testes da camada + regressão
visual sem diferença não intencional + docs atualizados + CI verde.

## Antes de mexer em dados

- `docs/architecture.md`: stack, fluxo de dados (DAL, Server Actions, TanStack Query), segurança
- `docs/domain.md`: entidades, papéis do espaço compartilhado, regras de cartão, transferência e parcelas
- `docs/import-and-onboarding.md`: onboarding, pipeline de importação e módulo de AI
- `docs/dashboard.md`: o que a visão geral responde
- `docs/roadmap.md`: fases e o que falta em cada uma
