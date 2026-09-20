# Tokens de cor

Definidos em `app/globals.css`. Nunca use cores cruas (`bg-zinc-100`, `#fff`,
`text-red-500`) em componentes: use o token semântico, que já resolve light e
dark.

## Anatomia do nome

```
<uso>-<família>-<papel>[-<estado>]
```

| Uso          | Utilitário           | Exemplo                                |
| ------------ | -------------------- | -------------------------------------- |
| `background` | `bg-`                | `bg-background-neutral-000`            |
| `typography` | `text-`              | `text-typography-neutral-secondary`    |
| `border`     | `border-`, `ring-`   | `border-border-neutral-subtle`         |
| `icon`       | `text-` (no svg)     | `text-icon-neutral-rest`               |
| `button`     | `bg-`                | `bg-button-brand-primary-hover`        |

Famílias: `neutral`, `brand-primary`, `brand-accent`, `status-critical`,
`status-success`, `status-warning`, `status-info`, `finance`.

`status-info` é o índigo do que **se repete** (recorrente, parcela). Ele existe
porque verde já é receita e vermelho já é despesa ou atraso: repetição não é nem
uma coisa nem outra, e pintar de verde faria "Recorrente" parecer entrada de
dinheiro.
Estados: `rest` → `hover` → `pressed` (e `disabled`).

**`-strong`**: variante escura de `background-status-critical` e
`background-status-success`, para quando há **texto branco por cima** (o selo
sólido do `Badge`). O `-rest` é claro demais: branco sobre ele dá contraste 3.9,
abaixo do mínimo de 4.5 que a a11y das stories cobra. Cor de fundo com texto
claro sempre usa `-strong`.

## Superfícies

| Token                        | Papel                                          |
| ---------------------------- | ---------------------------------------------- |
| `background`                 | Fundo da página                                |
| `background-surface-sunken`  | Moldura externa (`Panel.Root`, cabeçalho dos cards, dialogs) e sidebar: `#F8F9FB` claro, `#111112` escuro |
| `background-neutral-000`     | Cartão interno (`Panel.Body`, `DialogBody`); mesmo valor do fundo da página |
| `background-neutral-100/200` | Hover, trilhos (lista de tabs), skeleton       |
| `background-neutral-300`     | Controles desligados (Switch off)              |

A sidebar usa `background-surface-sunken` como fundo e `background-neutral-200`
no hover/item ativo; a área de conteúdo (`Sidebar.Inset`) usa `background`.

## Marca

- `brand-primary` é o verde-menta da paleta original. Por ser claro, o texto
  sobre ele é escuro: `text-typography-brand-on-primary`, e não
  `typography-neutral-on-color` (que é branco, usado em critical/success).
- `typography-brand-primary-*` é uma versão mais escura da menta, para texto
  legível sobre fundo branco.
- `brand-accent` (azul-violeta) é o botão secundário.

## Acessibilidade

- Tokens de **texto** (`typography-*`, `text-link`, `typography-finance-*`) têm
  contraste mínimo de **4,5:1** sobre `background`, `background-neutral-000/100/200`
  e `background-surface-sunken` no tema claro (WCAG AA). As stories rodam o axe e
  reprovam quando isso quebra.
- Tokens de **ícone** precisam de **3:1**. Por isso finanças têm dois conjuntos:
  `typography-finance-*` (mais escuros, para valores em texto) e
  `icon-finance-*` (cores originais da paleta).
- `typography-neutral-tertiary` não atinge 4,5:1: use só para placeholder e
  texto desabilitado, nunca para conteúdo.

## Domínio financeiro

| Token                                   | Uso                          |
| --------------------------------------- | ---------------------------- |
| `typography-finance-income` / `icon-…`  | Receitas, valores positivos  |
| `typography-finance-expense` / `icon-…` | Despesas, valores negativos  |
| `typography-finance-transfer` / `icon-…`| Transferências               |
| `typography-finance-single`             | Lançamento único             |
| `typography-finance-installment`        | Parcelado                    |
| `typography-finance-recurring`          | Recorrente                   |

Gráficos: escalas `chart-{indigo,violet,blue,teal,mint}-{50…900}`, iguais nos
dois temas.

## Origem

Os valores vieram de `docs/design/legacy-theme.css` (projeto anterior). Mapa
principal: `primary` → `brand-primary`, `destructive` → `status-critical`,
`muted-foreground` → `typography-neutral-secondary`, `border` →
`border-neutral-subtle`, `icon-income`/`text-positive` → `finance-income`,
`text-unique` → `finance-single`.

Superfícies e bordas do claro (`neutral-100/200/300`, `border-neutral-*`) usam os
valores do design system de origem do Panel (Centrii Portal).

## Nomes do shadcn (só para código de registry)

O código instalado de registries (`components/evilcharts`) usa classes do shadcn.
Em `app/globals.css` elas apontam para os nossos tokens: `foreground` →
`typography-neutral-primary`, `muted` → `background-neutral-100`,
`muted-foreground` → `typography-neutral-secondary`, `border` →
`border-neutral-subtle`, `primary` → `typography-brand-primary-rest`. Não use
esses nomes nos nossos componentes.

## Fundos do app (definidos pelo produto)

| Onde | Claro | Escuro | Token |
|---|---|---|---|
| Fundo padrão da página | `#FFFFFF` | `#1C1C1E` | `background` |
| Sidebar | `#F8F9FB` | `#111112` | `background-surface-sunken` |
| Cabeçalho dos cards (`Panel.Root`) | `#F8F9FB` | `#111112` | `background-surface-sunken` |
| Corpo dos cards (`Panel.Body`, tabelas) | `#FFFFFF` | `#1C1C1E` | `background-neutral-000` (igual ao fundo da página) |
