'use client';

import { Button, DeleteButton } from '@/components/ui/Button';
import { DialogClose, makeResponsiveDialog } from '@/components/ui/Dialog';
import { Icon, type Icons } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import * as React from 'react';

export type DeleteDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Executa a exclusão. O botão fica em loading até a promise resolver. */
  onConfirm: () => Promise<void>;
  title?: string;
  subtitle?: string;
  warnText?: string;
  deleteButtonText?: string;
  deleteButtonIcon?: Icons;
};

export function DeleteDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar exclusão',
  subtitle = 'Tem certeza que deseja excluir?',
  warnText = 'Essa ação não pode ser desfeita.',
  deleteButtonText = 'Excluir',
  deleteButtonIcon = 'delete',
}: DeleteDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return makeResponsiveDialog({
    title,
    open,
    onClose,
    onOpenChange: (isOpen) => !isOpen && !isSubmitting && onClose(),
    contentProps: {
      className: 'max-w-[500px]',
    },
    footer: (
      <>
        <DialogClose className="flex-1 xs:flex-none" asChild>
          <Button
            variant="outline"
            className="flex-1 xs:flex-none"
            icon={<Icon icon="close" />}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        </DialogClose>
        <DeleteButton
          isLoading={isSubmitting}
          onClick={handleConfirm}
          className="flex-1 xs:flex-none"
          icon={<Icon icon={deleteButtonIcon} />}
        >
          {deleteButtonText}
        </DeleteButton>
      </>
    ),
    children: (
      <div className="flex flex-col gap-1">
        <Text size="sm" weight="medium" className="block text-balance">
          {subtitle}
        </Text>
        <Text size="sm" color="secondary" className="block">
          {warnText}
        </Text>
      </div>
    ),
  });
}
