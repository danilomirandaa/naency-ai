import { Button } from '@/components/ui/Button';
import { List } from '@/components/ui/List';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

const meta: Meta = {
  title: 'UI/List',
};

export default meta;

export const InPanel: StoryObj = {
  render: () => (
    <Panel.Root className="max-w-md">
      <Panel.Body>
        <List.Root aria-label="Itens">
          {['Primeiro item', 'Segundo item com um nome bem longo que precisa truncar', 'Terceiro'].map(
            (name) => (
              <List.Item key={name}>
                <span className="size-8 shrink-0 rounded-full bg-background-neutral-100" />
                <List.ItemText>
                  <Text size="sm" weight="medium" className="truncate">
                    {name}
                  </Text>
                  <Text size="xs" color="secondary">
                    Descrição
                  </Text>
                </List.ItemText>
                <Button variant="outline" size="sm">
                  Ação
                </Button>
              </List.Item>
            ),
          )}
        </List.Root>
      </Panel.Body>
    </Panel.Root>
  ),
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole('list', { name: 'Itens' });
    await expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  },
};
