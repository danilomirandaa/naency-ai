# Padrão de componentes

> **Regra obrigatória.** Toda interface do Naency é montada a partir de componentes
> reutilizáveis, cada um com story. Páginas só compõem. Não é opção: PR que duplica
> UI ou cria componente sem story não entra.

## Camadas

Cada camada só importa das camadas de cima desta tabela:

| Camada | O que é | Exemplos |
| --- | --- | --- |
| `components/ui/` | Design system genérico, sem conhecer o domínio | Button, Panel, Sidebar, Dialog, Tabs |
| `components/finance/` | **Peças de domínio reutilizáveis entre features** | `MoneyValue` (valor formatado e colorido por tipo), `MoneyInput`, `PeriodPicker`, `CategoryBadge`, `CategorySelect`, `AccountSelect`, `InstitutionLogo`, `TransactionKindIcon`, `MemberAvatar` |
| `components/layout/` | Casca do app | AppSidebar, AppHeader, ThemeToggle |
| `features/<feature>/components/` | Composições de uma feature | `TransactionForm`, `TransactionTable`, `ImportReviewTable`, `InvoiceCard` |
| `app/**/page.tsx` | **Só compõe**: busca ou faz prefetch dos dados e monta componentes, sem markup de UI próprio | |

**Largura das telas**: toda tela ocupa a largura disponível
(`flex w-full flex-col gap-4`), sem `mx-auto max-w-*`. O respiro de 16px vem do
layout (`app/(app)/layout.tsx`), e o conteúdo começa alinhado à esquerda, como em
Transações.

Uma feature nunca importa componente de outra feature. Se duas precisam, ele sobe
para `components/finance/`.

## Regras de componentização

1. **Nenhum trecho de UI é duplicado.** Na segunda ocorrência, vira componente.
2. **Componente usado por 2+ features vai para `components/finance/`**; usado só
   por uma, fica em `features/<feature>/components/`.
3. **Formulários são montados por campos reutilizáveis.** O mesmo `TransactionForm`
   serve para criar, editar e corrigir uma linha na revisão da importação, e todos
   usam `MoneyInput`, `DatePicker`, `CategorySelect`, `AccountSelect`.
4. **Componentes recebem dados por props e não buscam dados.** Quem busca é um
   container da feature (hook do TanStack Query) ou a página. Assim todo componente
   pode ser testado isolado e ter story com dados de exemplo.
5. **Carregando, vazio e erro são estados do componente** (props/variantes),
   reaproveitando `Panel.QueryState` e `Panel.EmptyState`. Não são reinventados por tela.
6. **Todo componente de `ui`, `finance`, `layout` e `features/*/components` tem
   story** cobrindo variantes, estados e dark mode. A story é o contrato visual e
   também o teste ([testes](./testing.md)).
7. **Valores em dinheiro só aparecem via `MoneyValue`/`MoneyInput`**, nunca formatados à mão.
8. **Toda ação destrutiva pede confirmação em modal (`DeleteDialog`).** Excluir,
   remover, descartar ou desfazer algo que apaga dado nunca roda no primeiro
   clique: o botão abre o `DeleteDialog`, que diz o que some e se dá para
   desfazer, e só o botão de confirmação executa. A confirmação fica no próprio
   componente que tem o botão (ex.: `ImportSummary`, `InvoiceHeader`,
   `BudgetDialog`) ou no container que recebe `onDelete` (ex.:
   `TransactionsManager`). A story prova que nada acontece antes de confirmar.
   Arquivar não é exclusão (volta com um clique) e dispensa o modal.
9. **Toda ação assíncrona termina com aviso.** Nada que demora (importar,
   sugerir categorias, salvar em lote) acaba em silêncio: quem dispara recebe
   um toast (`useToast()`), e o que continua pendente aparece no sino do header.
   Ver [avisos](#avisos-toast-e-sino).

## Onde fica cada coisa

```
components/ui/<Nome>/index.tsx            componente do design system
components/ui/<Nome>/<Nome>.stories.tsx   story (obrigatória)
components/ui/Icon/icons.ts               registro único de ícones (Devigner, família Solar)
components/ui/Input/                      Input e Field (rótulo, descrição e erro acessíveis)
components/ui/List/                       linhas de lista (mídia, texto que trunca, ações)
components/ui/Button, Select, Popover,     portados do shadcn/ui com os tokens do Naency (Button no estilo radix-vega:
  Calendar, Spinner                       ícone como filho com data-icon, carregando = disabled + Spinner)
components/ui/DatePicker/                 data "AAAA-MM-DD" com Calendar em Popover, exibida em pt-BR
components/ui/Toast/                      avisos temporários (Radix Toast): ToastProvider + useToast()
components/finance/<Nome>/                peças de domínio reutilizáveis
components/finance/StatCard/              card de indicador (rótulo, valor, variação), em StatCard.Group
components/evilcharts/{ui,charts}/        gráficos do EvilCharts (Recharts), instalados pelo registry; ver "Gráficos"
components/layout/                        casca do app: AppSidebar, AppHeader, ThemeToggle
components/layout/navigation.ts           itens do menu e trilha do breadcrumb
features/<feature>/components/            composições da feature
features/<feature>/containers/            ligam query e actions aos componentes; sem markup próprio, sem story
hooks/                                    hooks genéricos (useTheme, useIsMobile, usePagination…)
lib/utils.ts                              classMerge (e `cn`, alias só para código de registry)
lib/theme.ts                              tipos do tema e script anti-flash do <head>
app/globals.css                           tokens e tema (ver docs/design/tokens.md)
app/(app)/layout.tsx                      páginas com sidebar (Sidebar.Provider + AppSidebar)
```

Estrutura de dados, Server Actions e queries por feature: [arquitetura](./architecture.md).

Página nova com menu lateral: crie em `app/(app)/<rota>/page.tsx` e, se ela
aparece no menu, adicione em `components/layout/navigation.ts` (o breadcrumb
sai de lá).

## Tema

Claro, escuro ou sistema (padrão), salvo em `localStorage` (`naency-theme`).
O script de `lib/theme.ts` roda no `<head>` e aplica `.dark` no `<html>` antes
da primeira pintura. Em componentes, use `useTheme()` só para UI que mostra a
opção escolhida; para estilo, use a variante `dark:` ou os tokens (que já
trocam sozinhos).

## Blocos do shadcn

Não rode `npx shadcn add` de componentes do shadcn (a exceção é o registry
`@evilcharts`, ver [Gráficos](#gráficos)): ele cria `components/ui/button.tsx`
e similares em minúsculo, que no macOS colidem com as nossas pastas, e reescreve
o `globals.css`. Faça assim: `npx shadcn@latest view <bloco>` para ler o
código, e porte para o padrão abaixo, trocando `cn` por `classMerge`, lucide
por `<Icon>`, `bg-sidebar`/`text-muted-foreground`/`bg-accent` pelos nossos
tokens e reaproveitando Button, Tooltip, DropdownMenu, Skeleton.

## Gráficos

Gráficos usam o [EvilCharts](https://evilcharts.com). O padrão é **Recharts**
(SVG no DOM: cores por variável CSS, light/dark sem re-render, testável nas
stories). O motor **ECharts** é a exceção, hoje só na curva do dashboard
(`CashflowChart`), e tem regras próprias:

| | Recharts (padrão) | ECharts |
|---|---|---|
| Desenho | SVG no DOM | `<canvas>` |
| Instalar | `@evilcharts/recharts-<gráfico>` | `@evilcharts/echarts-<gráfico>` |
| Cores | `var(--token)` resolvido pelo CSS | `var(--token)` lido do DOM no mount; a lib re-resolve ao trocar o tema |
| Tooltip | React | HTML (`formatValue` devolve string, não `ReactNode`) |
| Animação | `isAnimationActive: 'auto'` | `animation={false}`, senão a captura visual oscila |
| Story | conta nós de `svg` | espera o `canvas` com `waitFor` |

- Instalar: `npx shadcn@latest add @evilcharts/recharts-<gráfico>`. O
  `components.json` foi criado à mão só com o registry `@evilcharts`; **não rode
  `shadcn init`** (reescreve o `globals.css`). Os arquivos vão para
  `components/evilcharts/` e são código nosso: ajustes locais ficam marcados com
  `Naency:` no comentário (legenda na ordem das séries, `formatValue` no
  `ChartConfig` dos dois motores, `key` fora do spread na pizza, import morto
  removido no gráfico de área). **Reinstalar um gráfico sobrescreve os arquivos
  de `ui/` compartilhados**: confira o `git diff` depois e devolva os ajustes.
- O arquivo `echarts-*.tsx` guarda o estado do canvas num ref lido no render, o
  que a regra `react-hooks/refs` proíbe. A exceção está escopada a esses
  arquivos no `eslint.config.mjs` — não vale para código nosso.
- As partes compostas (`EvilBarChart.Bar`) vêm de módulo `'use client'`. Use-as
  só dentro de um componente client da feature (ex.:
  `features/dashboard/components/EvolutionChart`), que tem story; blocos que
  podem rodar no servidor importam esse componente.
- Cores: `colors: { light: ['var(--color-icon-finance-income)'] }` (o token já
  troca no escuro) ou a cor da categoria. A chave da série vira id de SVG e nome
  de variável CSS: use chaves simples (`income`, `slice0`), nunca o nome da
  categoria.
- Valores em centavos: passe `formatValue: (cents) => formatMoney(cents)` no
  `ChartConfig` para o tooltip.
- Acessibilidade: o gráfico fica em `aria-hidden` com
  `chartProps={{ accessibilityLayer: false }}` (e `rootTabIndex: -1` na pizza), e o
  bloco entrega os mesmos números em tabela `sr-only` ou lista.
- Animação: `isAnimationActive: 'auto'` respeita "reduzir movimento", que a
  regressão visual liga para ter capturas estáveis.

## Avisos: toast e sino

Dois canais, com papéis diferentes:

| Canal | Componente | Para quê | Vida |
|---|---|---|---|
| Toast | `components/ui/Toast` | resposta a uma ação (terminou, falhou) | some sozinho |
| Sino | `features/notifications` | o que continua pendente (atrasadas, fatura fechada, importação recente) | fica até resolver |
| Sistema | `features/imports/jobs.ts` | avisar com a aba fechada/em segundo plano | notificação do SO |

**Toast.** `ToastProvider` fica em `app/(app)/providers.tsx` (dentro do
`QueryClientProvider`) e só um por app. Dentro de qualquer componente client:

```tsx
const toast = useToast();
toast({ title: 'Importação concluída', description: '142 lançamentos entraram em Nubank.', variant: 'success' });
```

Variantes: `neutral` (padrão), `success`, `critical`. Toast **não substitui**
tratamento de erro na tela: o formulário continua mostrando o erro no campo; o
toast é o aviso de que algo que rodava longe do olho terminou. `duration: null`
deixa o aviso fixo até fechar (use só em erro que precisa de ação).

**Sino.** `NotificationsBell` é puro (recebe `items` e `lastSeenAt` por props);
quem busca é `NotificationsMenu`, que guarda a última abertura em `localStorage`
(`naency-notificacoes-vistas`) — por isso o "novo" é por dispositivo, não por
usuário. A lista não vem de tabela: `server/dal/notifications.ts` **deriva** os
avisos dos dados (importações finalizadas nos últimos 7 dias, contas vencidas e
não pagas, faturas fechadas sem pagamento). Aviso novo = regra nova nesse DAL,
com teste de integração; nunca um insert.

**Trabalho em segundo plano.** Importar e sugerir categorias respondem na hora e
seguem em `after()` ([arquitetura](./architecture.md#trabalho-depois-da-resposta)).
Quem avisa o fim é o `ImportJobsWatcher`, montado no layout do app: ele observa
os lotes do espaço inteiro, então o aviso chega mesmo se a pessoa saiu da tela de
importação ou deu F5. A lógica pura (`finishedBatches`, `jobNotice`,
`notifyOutsideTab`) vive em `features/imports/jobs.ts`, com teste unitário; o
container só liga ao TanStack Query. Notificação do SO só sai com permissão dada
em um clique e com a aba em segundo plano — nunca pedimos permissão ao carregar.

## Regras

1. **Import absoluto** sempre: `@/components/ui/Panel`, `@/lib/utils`.
2. **Classes via `classMerge`**, com `className` do consumidor por último.
3. **Só tokens semânticos** para cor (`bg-background-neutral-000`), nunca
   paleta crua do Tailwind.
4. **Compound components** com `Object.assign` quando há partes que só fazem
   sentido juntas: `Panel.Root`, `Panel.Header`, `Tabs.Root`, `Tabs.Tab`.
   Cada parte também é exportada com nome próprio e ganha `displayName`
   (`'Panel.Root'`).
5. **Estado controlado e não controlado**: aceite `value`/`defaultValue` +
   `onValueChange` (ou `checked`/`defaultChecked` + `onCheckedChange`). Não
   sincronize prop com estado via `useEffect`: derive (`value ?? interno`).
6. **Primitivos Radix** para comportamento acessível (dialog, switch, tabs,
   tooltip…); o componente só adiciona estilo e API.
7. **Variantes com `cva`** quando há combinações (ver `Button`); objetos
   `Record<Variant, string>` quando é uma dimensão só (ver `Tabs`).
8. **`'use client'`** apenas em arquivos que usam estado, efeitos, contexto ou
   Radix.
9. **Nada de `'use client'` em arquivo que exporta constantes lidas no
   servidor** (ex.: nome de cookie): o valor chega como referência de cliente.
   Coloque em um `constants.ts` separado (ver `Sidebar/constants.ts`).
10. **Ícones pelo nome**: `<Icon icon="delete" />`. Ícone novo entra em
   `components/ui/Icon/icons.ts`, nunca importado direto de `@devigner-ui/icons`
   no componente. No registro: importar por subcaminho
   (`@devigner-ui/icons/<Nome>`) e usar só a família Solar (traço consistente).
   Créditos em [créditos](./credits.md).
11. **Textos padrão em pt-BR** (`Cancelar`, `Excluir`), sempre sobrescrevíveis
    por prop.

## Tailwind v4

Não existe `tailwind.config`. Tokens, breakpoints (`xs`, `3xl`), raios
(`rounded-control*`), sombras e animações ficam em `@theme` no
`app/globals.css`. Ao trazer código de Tailwind v3: `shadow-sm` → `shadow-xs`,
`rounded` → `rounded-sm`, `outline-none` → `outline-hidden`, `ring` → `ring-3`,
`bg-gradient-to-*` → `bg-linear-to-*`, `!classe` → `classe!`,
`origin-[--var]` → `origin-(--var)`.

## Checklist de componente novo

Todos os itens são obrigatórios:

- [ ] Na camada certa (`ui`, `finance`, `layout` ou `features/<feature>/components`)
- [ ] Recebe dados por props e segue as regras acima
- [ ] Story para cada variante e estado (padrão, carregando, vazio, erro, desabilitado), em light e dark
- [ ] `play` para cada interação relevante e a11y sem violações
- [ ] Baseline visual gerado e revisado
- [ ] `npm run typecheck`, `npm run lint` e `npm run test` limpos ([testes](./testing.md))

Esse checklist faz parte da **definição de pronto** de qualquer entrega: componentes com
story + testes da camada + regressão visual sem diferença não intencional + docs
atualizados + CI verde ([testes](./testing.md#definição-de-pronto)).
