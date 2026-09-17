'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { cardsQuery } from '@/features/cards/api/cards.queries';
import { CardsList } from '@/features/cards/components/CardsList';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

const NEW_CARD_HREF = '/contas?nova=cartao';

/** Container: lista de cartões. */
export function CardsScreen({ workspaceId, canEdit }: { workspaceId: string; canEdit: boolean }) {
  const cards = useQuery(cardsQuery.list(workspaceId));
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <PageHeader
        title="Cartões"
        description="Faturas, vencimentos e limite de cada cartão."
        actions={
          canEdit ? (
            <Button asChild>
              <Link href={NEW_CARD_HREF}>
                <Icon icon="add" data-icon="inline-start" />
                Novo cartão
              </Link>
            </Button>
          ) : undefined
        }
      />
      <CardsList
        cards={cards.data ?? []}
        canEdit={canEdit}
        newCardHref={NEW_CARD_HREF}
        isLoading={cards.isPending}
        isError={cards.isError}
      />
    </div>
  );
}
