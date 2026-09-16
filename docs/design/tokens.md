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
`status-success`, `status-warning`, `finance`.
Estados: `rest` → `hover` → `pressed` (e `disabled`).

## Superfícies

| Token                        | Papel                                          |
| ---------------------------- | ---------------------------------------------- |
| `background`                 | Fundo da página                                |
| `background-surface-sunken`  | Moldura externa (`Panel.Root`, dialogs)        |
| `background-neutral-000`     | Cartão interno (`Panel.Body`, `DialogBody`)    |
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
