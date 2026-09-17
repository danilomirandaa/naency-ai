# Domínio

Entidades, relações e regras de negócio do Naency. Nomes de tabela e coluna em
inglês (como ficam no banco); explicações em pt-BR. Convenções gerais (centavos,
datas, soft delete, autoria) estão em [arquitetura](./architecture.md#convenções-de-dados).

## Glossário

| Termo na interface | Entidade | Significado |
| --- | --- | --- |
| Espaço | `workspaces` | Conjunto de finanças compartilhado (ex.: "Finanças da casa") |
| Membro | `workspace_members` | Pessoa com acesso a um espaço, com um papel |
| Instituição / banco | `institutions` | Nubank, XP, Itaú… |
| Conta | `accounts` | Conta corrente, poupança, investimento, dinheiro ou cartão de crédito |
| Lançamento / transação | `transactions` | Receita, despesa ou transferência |
| Fatura | `card_invoices` | Período de cobrança de um cartão |
| Parcelado | `installment_groups` | Compra dividida em N parcelas |
| Recorrente | `recurring_rules` | Lançamento que se repete (aluguel, salário) |
| Importação | `import_batches` | Um arquivo de extrato enviado e processado |

## Diagrama

```mermaid
erDiagram
  profiles ||--o{ workspace_members : participa
  workspaces ||--o{ workspace_members : tem
  workspaces ||--o{ workspace_invitations : convida
  workspaces ||--o{ accounts : possui
  workspaces ||--o{ categories : possui
  workspaces ||--o{ transactions : possui
  workspaces ||--o{ categorization_rules : aprende
  workspaces ||--o{ import_batches : importa
  workspaces ||--o{ activity_log : registra
  workspaces ||--o{ ai_usage_events : consome
  institutions ||--o{ accounts : emite
  accounts ||--o| credit_card_details : "se for cartão"
  accounts ||--o{ card_invoices : fatura
  accounts ||--o{ transactions : movimenta
  card_invoices ||--o{ transactions : agrupa
  categories ||--o{ transactions : classifica
  categories ||--o{ categories : subcategoria
  installment_groups ||--o{ transactions : parcela
  recurring_rules ||--o{ transactions : gera
  import_batches ||--o{ import_rows : contém
  import_batches ||--o{ transactions : originou
```

## Identidade e compartilhamento

Os dados financeiros **pertencem ao espaço, não à pessoa**. Duas pessoas no mesmo
espaço veem os mesmos dados, cada uma logada na própria conta.

- **`profiles`**: `id` (igual ao usuário do Supabase Auth), `name`, `avatar_url`.
- **`workspaces`**: `name`, `currency` (padrão `BRL`), `onboarding_step`
  (onboarding retomável), `created_by`.
- **`workspace_members`**: `workspace_id`, `user_id`, `role`, `joined_at`.
  Chave única (`workspace_id`, `user_id`).
- **`workspace_invitations`**: `workspace_id`, `email`, `role`, `token_hash`,
  `expires_at`, `accepted_at`, `invited_by`.

### Papéis

| Ação | `admin` | `editor` | `viewer` (leitor) |
| --- | :-: | :-: | :-: |
| Ver todos os dados do espaço | ✓ | ✓ | ✓ |
| Criar, editar e excluir lançamentos, contas, categorias | ✓ | ✓ | — |
| Importar extratos | ✓ | ✓ | — |
| Convidar, remover e mudar papel de membros | ✓ | — | — |
| Renomear ou excluir o espaço | ✓ | — | — |

Regras:

- Um espaço tem sempre pelo menos um `admin`; o último admin não pode sair nem ser rebaixado.
- Um usuário pode estar em vários espaços.
- Convite é um **link** (`/convite/<token>`) gerado em `/membros` e enviado por quem
  convida (WhatsApp, e-mail pessoal). Expira em 7 dias e é de uso único; o banco guarda
  só o hash SHA-256 do token.
- Só aceita quem entrar com **o e-mail convidado**: um link vazado não serve para outra
  pessoa. Quem entra com outro e-mail vê só o e-mail convidado mascarado (`a***@dominio`).
- Convidar de novo o mesmo e-mail substitui o convite pendente anterior. Não dá para
  convidar quem já é membro, nem convidar como `admin` (por enquanto).
- O aceite marca o convite como usado só se ele ainda não foi (duas abas ao mesmo tempo
  não criam dois aceites). Regras em `server/invitations/evaluate.ts`, com testes.
- Quem entra por convite **pula o onboarding**, porque o espaço já está configurado.
- A regra é aplicada no DAL (`requireMembership`) e coberta por testes de integração por papel ([testes](./testing.md)).

## Instituições

- **`institutions`**: `slug` (identificador estável do catálogo), `name`, `compe_code`, `kind` (`bank | broker | wallet`),
  `color`, `logo`, `import_formats` (ex.: `['csv','ofx','pdf']`),
  `export_instructions` (passo a passo para exportar o extrato naquele banco),
  `workspace_id` (nulo no catálogo global; preenchido quando o espaço cadastra uma instituição própria).
- Catálogo semeado (migration `0002_seed_institutions.sql`): Nubank, XP, Itaú, Inter,
  C6, Banco do Brasil, Caixa, Bradesco, Santander e "Dinheiro/Carteira". Formatos de
  importação e instruções de exportação são preenchidos na Fase 3, com extratos reais.
- A interface mostra iniciais sobre a cor da instituição, sem logos de terceiros.
- Uma conta só pode apontar para instituição do catálogo ou do próprio espaço (checado no DAL).

## Contas

- **`accounts`**: `workspace_id`, `institution_id`, `name`, `type`
  (`checking | savings | investment | cash | credit_card`), `currency`,
  `initial_balance_cents`, `initial_balance_date`, `color`, `archived_at`.
- **Saldo não é armazenado.** Saldo = `initial_balance_cents` + soma de
  `amount_cents` dos lançamentos efetivados a partir de `initial_balance_date`.
- Tipos criáveis hoje: corrente, poupança, investimentos e dinheiro. Cartão de crédito
  entra na Fase 2, com fechamento, vencimento e faturas.
- Leitor vê as contas; editor e admin criam, editam e arquivam. Não há exclusão:
  arquivar preserva o histórico.
- Conta arquivada some das listas, mas seus lançamentos continuam no histórico e nos relatórios.

## Cartão de crédito

Cartão é uma conta do tipo `credit_card` com detalhes e faturas.

- **`credit_card_details`**: `account_id` (PK), `closing_day`, `due_day`,
  `limit_cents`, `default_payment_account_id`.
- **`card_invoices`**: `account_id`, `reference_month` (ex.: 2026-09), `closing_date`,
  `due_date`, `status` (`open | closed | paid`).

Regras:

- **Qual fatura recebe a compra**: compra com data até o dia de fechamento entra na
  fatura do mês; depois do fechamento, na do mês seguinte. A fatura é criada sob
  demanda quando o primeiro lançamento cai nela.
- **Total da fatura** é calculado pela soma dos lançamentos ligados a ela.
- **Pagar fatura** é uma transferência da conta de pagamento para a conta do cartão
  (ver Transferência), que marca a fatura como `paid`.
- **Limite disponível** = `limit_cents` − saldo devedor do cartão.

## Lançamentos

- **`transactions`**: `workspace_id`, `account_id`, `kind`
  (`income | expense | transfer`), `amount_cents` (com sinal), `date`,
  `description` (limpa, exibida), `raw_description` (como veio do banco),
  `category_id`, `status` (`planned | cleared`), `invoice_id`,
  `transfer_group_id`, `installment_group_id`, `installment_number`,
  `installment_total`, `recurring_rule_id`, `import_batch_id`, `fingerprint`,
  `notes`, `created_by`, `updated_by`, `deleted_at`.

Regras:

- **Sinal**: `income` > 0, `expense` < 0. Em `transfer`, a perna de saída é negativa e a de entrada, positiva.
- **Transferência** = dois lançamentos com o mesmo `transfer_group_id`, um em cada
  conta, com valores opostos e sem categoria. Editar ou excluir uma perna afeta as duas.
- **Transferência não conta como receita nem como despesa** nos relatórios.
- **Parcelado** (`installment_groups`: `description`, `total_amount_cents`,
  `installments_count`, `first_date`): gera N lançamentos, um em cada fatura futura.
  A diferença de arredondamento de centavos vai na primeira parcela.
- **Recorrente** (`recurring_rules`: `account_id`, `kind`, `amount_cents`,
  `category_id`, `frequency` `monthly | weekly | yearly`, `day`, `next_date`,
  `active`): gera lançamentos `planned` (contas a vencer). Confirmar o pagamento os
  torna `cleared`.
- **`planned`** não entra no saldo atual; entra na projeção.
- **`fingerprint`** = hash de (conta, data, valor, descrição normalizada, ordem da
  ocorrência no dia). Serve para deduplicar importações.

## Categorias

- **`categories`**: `workspace_id`, `parent_id`, `name`, `kind` (`income | expense`),
  `icon`, `color`, `archived_at`.
- Criar o espaço semeia um conjunto padrão em pt-BR (Moradia, Mercado, Transporte,
  Saúde, Lazer, Educação, Assinaturas, Salário, Investimentos…).
- Profundidade máxima de 2 níveis (categoria → subcategoria).
- Categoria arquivada não aparece para novos lançamentos, mas continua nos antigos.

## Memória de categorização

- **`categorization_rules`**: `workspace_id`, `match_type` (`contains | exact`),
  `pattern` (sobre a descrição normalizada), `category_id`, `rename_to`,
  `source` (`user | ai`), `hits`, `last_used_at`.
- É aplicada **antes** de chamar a AI. Uma regra do usuário vence uma regra da AI.
- Quando o usuário corrige uma categoria na revisão da importação, ele pode marcar
  "lembrar para os próximos", o que cria ou atualiza uma regra `user`.

## Importação

Detalhes do fluxo em [importação e onboarding](./import-and-onboarding.md).

- **`import_batches`**: `workspace_id`, `account_id`, `institution_id`,
  `file_path`, `file_format` (`pdf | csv | ofx`), `document_kind`
  (`statement | card_invoice`), `period_start`, `period_end`, `status`
  (`uploaded → processing → review → completed | failed`), `error`,
  `ai_model`, `ai_cost_cents`, `created_by`.
- **`import_rows`**: `batch_id`, `parsed` (data, valor, descrição original),
  `suggestion` (descrição limpa, categoria, tipo, parcela, possível transferência),
  `confidence`, `duplicate_of_transaction_id`, `decision` (`pending | accept | skip`),
  `edited` (valores alterados na revisão).

## Atividade e custos

- **`activity_log`**: `workspace_id`, `actor_id`, `action`, `entity_type`,
  `entity_id`, `summary`, `created_at`. Mostra aos membros o que mudou
  (ex.: "Danilo importou a fatura Nubank de setembro").
- **`ai_usage_events`**: `workspace_id`, `task` (`extract | enrich | …`), `model`,
  `input_tokens`, `output_tokens`, `cost_cents`, `import_batch_id`, `created_at`.
  Alimenta a tela de consumo de AI em Configurações.

## Futuro (ainda sem modelo)

Orçamentos por categoria e metas de economia, no menu "Planejamento".
