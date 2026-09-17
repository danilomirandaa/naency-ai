import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';

/** Atribuições exigidas por licença (docs/credits.md). */
export function CreditsCard() {
  return (
    <Panel.Root>
      <Panel.Header>
        <Panel.HeaderText>
          <Panel.Title>Sobre</Panel.Title>
        </Panel.HeaderText>
      </Panel.Header>
      <div className="px-4 pb-4">
        <Text size="xs" color="secondary" element="p">
          Ícones de{' '}
          <a className="underline underline-offset-2" href="https://icons.remidevigner.pro" target="_blank" rel="noreferrer">
            Devigner Icons
          </a>
          , derivados do{' '}
          <a
            className="underline underline-offset-2"
            href="https://www.figma.com/community/file/1166831539721848736"
            target="_blank"
            rel="noreferrer"
          >
            Solar Icon Set
          </a>{' '}
          (480 Design), licenciados sob{' '}
          <a className="underline underline-offset-2" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
            CC BY 4.0
          </a>
          , com modificações.
        </Text>
      </div>
    </Panel.Root>
  );
}
