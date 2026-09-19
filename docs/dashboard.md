# Dashboard

O dashboard (Visão geral, rota `/`) responde, em poucos segundos de olhar, **"como
estão as finanças do espaço neste mês e para onde está indo o dinheiro"**.
Entidades em [domínio](./domain.md).

## Perguntas e blocos

| Pergunta | Bloco | Fonte |
| --- | --- | --- |
| Quanto temos agora? | **Saldo em contas** na faixa do topo (`PeriodSummary`) e saldo por conta na lateral (cartões à parte, como dívida) | `accounts` + `transactions` efetivadas |
| Ganhamos mais do que gastamos? | **Receitas × despesas × resultado** na faixa do topo, cada um com a variação sobre o período anterior | `transactions` (sem transferências) |
| O mês está no azul? | **Curva do que sobrou, dia a dia** (`Cashflow`), com o melhor e o pior dia | `transactions` agrupadas por data |
| Para onde foi o dinheiro? | **Despesas por categoria**, com subcategorias ao aprofundar | `transactions` + `categories` |
| Sobrou em quais meses? | **Balanço mensal** (`MonthlyBalance`): resultado de cada mês em barras divergentes, com média e quantos fecharam no azul | mesmo bloco `evolucao` |
| Estamos melhorando? | **Evolução de 6 a 12 meses** (receitas, despesas) | `transactions` |
| Quanto devemos no cartão? | **Faturas**: aberta atual, próximo vencimento, limite usado | `card_invoices`, `credit_card_details` |
| O que vence em breve? | **Próximas contas e parcelas** (7 a 30 dias) | lançamentos `planned`, `recurring_rules`, `installment_groups` |
| O que mudou? | **Últimos lançamentos** com quem lançou | `transactions` + `activity_log` |

## Leitura da tela

A ordem é a ordem em que a pergunta aparece na cabeça de quem abre o app:

1. **Faixa do topo** (`PeriodSummary`, largura cheia): saldo em contas, receitas,
   despesas e resultado. Cada card é link para a lista por trás do número, e os
   três do período trazem a variação sobre o anterior — subir é bom em receitas e
   ruim em despesas, e a cor da seta diz qual é o caso.
2. **Curva do período** (`Cashflow`), o bloco de maior área: mostra a tendência,
   que nenhum número sozinho mostra. Começa em zero no primeiro dia do período —
   ela responde "o período está no azul?", não "quanto tenho na conta".
3. **Para onde foi o dinheiro** e, lado a lado, **balanço mensal** e **evolução
   dos meses** — o balanço responde "sobrou?" e a evolução, "de onde veio?".
4. **Coluna lateral**: saldo por conta, o que vence e os últimos lançamentos.

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
- `components/finance/StatCard`: o card de indicador da faixa do topo, dentro de
  `StatCard.Group`. É o mesmo componente do resumo da tela
  de Transações (`TransactionsSummary`), então os dois não divergem de aparência.
- `server/dal/dashboard.ts`: uma função por bloco; `/api/workspaces/[id]/dashboard/[bloco]?de=&ate=`.
  O bloco `fluxo` devolve **um ponto por dia**, inclusive os dias sem movimento,
  para a curva não ter buraco (limite de 400 pontos).

## Visualização

Gráficos com EvilCharts sobre Recharts ([padrão](./components.md#gráficos)):
curva do período em área (`CashflowChart`, **o único sobre ECharts**, com a cor
virando vermelha quando o período fecha no vermelho),
evolução em colunas (`EvolutionChart`) e categorias em rosca com o total no
centro (`CategoryDonut`), acima da lista com barras. Valor no eixo usa
`formatMoneyCompact` ("R$ 2,4 mil"); o exato fica no tooltip. O balanço mensal
é a exceção: com seis barras divergentes, CSS lê melhor que gráfico e cada valor
fica escrito ao lado, sem depender de passar o mouse. Ao criar um gráfico novo,
carregar a skill `dataviz` e usar os tokens `chart-*` (escalas) e `finance-*`
(receita, despesa, transferência) de `app/globals.css`. Os gráficos precisam
funcionar em light e dark.

## Depois

Insights gerados por AI ("gastos com delivery subiram 40% em relação à média") e
alertas de orçamento, quando o planejamento existir.
