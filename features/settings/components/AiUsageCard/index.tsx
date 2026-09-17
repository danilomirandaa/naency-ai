import { List } from '@/components/ui/List';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import type { AiUsageSummary } from '@/features/settings/types';
import { formatMonth } from '@/lib/dates';

export type AiUsageCardProps = {
  enabled: boolean;
  model: string;
  usage: AiUsageSummary;
};

const number = new Intl.NumberFormat('pt-BR');
const TASK_LABELS: Record<string, string> = { enrich: 'Sugestões na importação' };

/** Estado da AI e consumo de tokens do mês. */
export function AiUsageCard({ enabled, model, usage }: AiUsageCardProps) {
  return (
    <Panel.Root>
      <Panel.Header>
        <Panel.HeaderText>
          <Panel.Title>Assistência com AI</Panel.Title>
          <Panel.Description>
            {enabled
              ? `Ligada · modelo ${model}`
              : 'Desligada. Configure a ANTHROPIC_API_KEY no servidor para receber sugestões de categoria.'}
          </Panel.Description>
        </Panel.HeaderText>
        <Panel.RowBadge color={enabled ? 'green' : 'gray'}>{enabled ? 'Ligada' : 'Desligada'}</Panel.RowBadge>
      </Panel.Header>
      <Panel.Body>
        {usage.items.length === 0 ? (
          <Text size="sm" color="secondary" element="p" className="px-4 py-3">
            Nenhum uso em {formatMonth(usage.month).toLowerCase()}.
          </Text>
        ) : (
          <List.Root aria-label={`Consumo de AI em ${formatMonth(usage.month)}`}>
            {usage.items.map((item) => (
              <List.Item key={`${item.task}-${item.model}`}>
                <List.ItemText>
                  <Text size="sm" weight="medium">
                    {TASK_LABELS[item.task] ?? item.task}
                  </Text>
                  <Text size="xs" color="secondary">
                    {item.model} · {item.calls} {item.calls === 1 ? 'chamada' : 'chamadas'}
                  </Text>
                </List.ItemText>
                <Text size="xs" color="secondary" className="tabular-nums">
                  {number.format(item.inputTokens)} tokens de entrada · {number.format(item.outputTokens)} de saída
                </Text>
              </List.Item>
            ))}
          </List.Root>
        )}
      </Panel.Body>
    </Panel.Root>
  );
}
