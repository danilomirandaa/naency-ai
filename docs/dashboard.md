# Dashboard

O dashboard (Visão geral, rota `/`) responde, em poucos segundos de olhar, **"como
estão as finanças do espaço neste mês e para onde está indo o dinheiro"**.
Entidades em [domínio](./domain.md).

## Perguntas e blocos

| Pergunta | Bloco | Fonte |
| --- | --- | --- |
| Quanto temos agora? | **Saldo total** e saldo por conta (cartões à parte, como dívida) | `accounts` + `transactions` efetivadas |
| Ganhamos mais do que gastamos? | **Receitas × despesas × resultado** do mês, comparado ao mês anterior | `transactions` (sem transferências) |
| Para onde foi o dinheiro? | **Despesas por categoria**, com subcategorias ao aprofundar | `transactions` + `categories` |
| Estamos melhorando? | **Evolução de 6 a 12 meses** (receitas, despesas, resultado) | `transactions` |
| Quanto devemos no cartão? | **Faturas**: aberta atual, próximo vencimento, limite usado | `card_invoices`, `credit_card_details` |
| O que vence em breve? | **Próximas contas e parcelas** (7 a 30 dias) | lançamentos `planned`, `recurring_rules`, `installment_groups` |
| O que mudou? | **Últimos lançamentos** com quem lançou | `transactions` + `activity_log` |

## Regras

- Um **seletor de mês** controla todos os blocos. O padrão é o mês atual no fuso `America/Sao_Paulo`.
- **Transferências não entram** em receitas nem em despesas.
- Lançamentos `planned` aparecem só em "próximas contas" e na projeção, nunca no realizado.
- Compras no cartão contam como despesa **na data da compra** (competência). O
  pagamento da fatura é transferência, então a despesa não é contada duas vezes.
- Cada bloco tem estado de carregando, vazio (com ação: "Importe um extrato") e erro,
  reaproveitando `Panel.QueryState`.
- Todo bloco é um componente com story ([componentes](./components.md)).
  A página só compõe os blocos.
- Cada bloco é uma query própria, para carregar e falhar de forma independente.

## Implementação

- `features/dashboard/components`: um componente por bloco, todos sobre `DashboardCard`
  (título + estados). Stories em `DashboardBlocks.stories.tsx`.
- `server/dal/dashboard.ts`: uma função por bloco; `/api/workspaces/[id]/dashboard/[bloco]?mes=`.
- Gráficos em CSS (barras), sem biblioteca: determinísticos nos screenshots e com
  tabela para leitores de tela. Trocar por biblioteca só se surgir um gráfico que
  CSS não resolva.

## Visualização

Gráficos com EvilCharts sobre Recharts ([padrão](./components.md#gráficos)):
Evolução em colunas (`EvolutionChart`) e categorias em rosca com o total no
centro (`CategoryDonut`), acima da lista com barras. Ao criar um gráfico novo,
carregar a skill `dataviz` e usar os tokens `chart-*` (escalas) e `finance-*`
(receita, despesa, transferência) de `app/globals.css`. Os gráficos precisam
funcionar em light e dark.

## Depois

Insights gerados por AI ("gastos com delivery subiram 40% em relação à média") e
alertas de orçamento, quando o planejamento existir.
