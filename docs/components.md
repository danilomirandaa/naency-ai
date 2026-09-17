# Padrão de componentes

> **Regra obrigatória.** Toda interface do Naency é montada a partir de componentes
> reutilizáveis, cada um com story. Páginas só compõem. Não é opção: PR que duplica
> UI ou cria componente sem story não entra.

## Camadas

Cada camada só importa das camadas de cima desta tabela:

| Camada | O que é | Exemplos |
| --- | --- | --- |
| `components/ui/` | Design system genérico, sem conhecer o domínio | Button, Panel, Sidebar, Dialog, Tabs |
| `components/finance/` | **Peças de domínio reutilizáveis entre features** | `MoneyValue` (valor formatado e colorido por tipo), `MoneyInput`, `DateInput`, `PeriodPicker`, `CategoryBadge`, `CategorySelect`, `AccountSelect`, `InstitutionLogo`, `TransactionKindIcon`, `MemberAvatar` |
| `components/layout/` | Casca do app | AppSidebar, AppHeader, ThemeToggle |
| `features/<feature>/components/` | Composições de uma feature | `TransactionForm`, `TransactionTable`, `ImportReviewTable`, `InvoiceCard` |
| `app/**/page.tsx` | **Só compõe**: busca ou faz prefetch dos dados e monta componentes, sem markup de UI próprio | |

Uma feature nunca importa componente de outra feature. Se duas precisam, ele sobe
para `components/finance/`.

## Regras de componentização

1. **Nenhum trecho de UI é duplicado.** Na segunda ocorrência, vira componente.
2. **Componente usado por 2+ features vai para `components/finance/`**; usado só
   por uma, fica em `features/<feature>/components/`.
3. **Formulários são montados por campos reutilizáveis.** O mesmo `TransactionForm`
   serve para criar, editar e corrigir uma linha na revisão da importação, e todos
   usam `MoneyInput`, `DateInput`, `CategorySelect`, `AccountSelect`.
4. **Componentes recebem dados por props e não buscam dados.** Quem busca é um
   container da feature (hook do TanStack Query) ou a página. Assim todo componente
   pode ser testado isolado e ter story com dados de exemplo.
5. **Carregando, vazio e erro são estados do componente** (props/variantes),
   reaproveitando `Panel.QueryState` e `Panel.EmptyState`. Não são reinventados por tela.
6. **Todo componente de `ui`, `finance`, `layout` e `features/*/components` tem
   story** cobrindo variantes, estados e dark mode. A story é o contrato visual e
   também o teste ([testes](./testing.md)).
7. **Valores em dinheiro só aparecem via `MoneyValue`/`MoneyInput`**, nunca formatados à mão.

## Onde fica cada coisa

```
components/ui/<Nome>/index.tsx            componente do design system
components/ui/<Nome>/<Nome>.stories.tsx   story (obrigatória)
components/ui/Icon/icons.ts               registro único de ícones (Devigner, família Solar)
components/ui/Input/                      Input e Field (rótulo, descrição e erro acessíveis)
components/finance/<Nome>/                peças de domínio reutilizáveis
components/layout/                        casca do app: AppSidebar, AppHeader, ThemeToggle
components/layout/navigation.ts           itens do menu e trilha do breadcrumb
features/<feature>/components/            composições da feature
hooks/                                    hooks genéricos (useTheme, useIsMobile, usePagination…)
lib/utils.ts                              classMerge
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

Não rode `npx shadcn add` direto no projeto: ele cria `components/ui/button.tsx`
e similares em minúsculo, que no macOS colidem com as nossas pastas, e reescreve
o `globals.css`. Faça assim: `npx shadcn@latest view <bloco>` para ler o
código, e porte para o padrão abaixo, trocando `cn` por `classMerge`, lucide
por `<Icon>`, `bg-sidebar`/`text-muted-foreground`/`bg-accent` pelos nossos
tokens e reaproveitando Button, Tooltip, DropdownMenu, Skeleton.

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
