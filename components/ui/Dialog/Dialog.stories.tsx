import { Icon } from '@/components/ui/Icon';
import { Button, SaveButton } from '@/components/ui/Button';
import {
  DialogClose,
  makeResponsiveDialog,
} from '@/components/ui/Dialog';
import { Text } from '@/components/ui/Text';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { useState } from 'react';

const meta: Meta = {
  title: 'Design System/Dialog',
};

export default meta;

type Story = StoryObj;

function ResponsiveDialogDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      {makeResponsiveDialog({
        title: 'Edit display name',
        description: 'Shown across the portal wherever your name appears',
        open,
        onClose: () => setOpen(false),
        onOpenChange: (isOpen) => !isOpen && setOpen(isOpen),
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
              >
                Cancel
              </Button>
            </DialogClose>
            <SaveButton
              className="flex-1 xs:flex-none"
              onClick={() => setOpen(false)}
            />
          </>
        ),
        children: (
          <Text size="sm" color="secondary" className="block">
            The dialog renders as a centred modal on every viewport, with the
            noise overlay behind it.
          </Text>
        ),
      })}
    </>
  );
}

export const Default: Story = {
  render: () => <ResponsiveDialogDemo />,
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Open dialog' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Edit display name',
    });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

function WithoutCloseButtonDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open dialog without close button
      </Button>
      {makeResponsiveDialog({
        title: 'Add redirect URL',
        description:
          'Enter a redirect URL to allow it during native OAuth flows.',
        hideClose: true,
        open,
        onClose: () => setOpen(false),
        onOpenChange: (isOpen) => !isOpen && setOpen(isOpen),
        contentProps: {
          className: 'max-w-[560px]',
        },
        footer: (
          <>
            <DialogClose className="flex-1 xs:flex-none" asChild>
              <Button
                variant="outline"
                className="flex-1 xs:flex-none"
                icon={<Icon icon="close" />}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="flex-1 xs:flex-none"
              onClick={() => setOpen(false)}
            >
              Add
            </Button>
          </>
        ),
        children: (
          <label className="flex flex-col gap-1.5">
            <Text size="xs" weight="medium" color="secondary">
              Redirect URL
            </Text>
            <input
              placeholder="https://example.com/oauth"
              className="h-8 rounded-control border border-border-neutral-rest bg-background-neutral-000 px-2.5 text-sm text-typography-neutral-primary shadow-input outline-hidden placeholder:text-typography-neutral-tertiary"
            />
          </label>
        ),
      })}
    </>
  );
}

export const WithoutCloseButton: Story = {
  render: () => <WithoutCloseButtonDemo />,
};

function WithoutTitleDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open dialog without title
      </Button>
      {makeResponsiveDialog({
        hideClose: true,
        accessibleTitle: 'Session expired',
        open,
        onClose: () => setOpen(false),
        onOpenChange: (isOpen) => !isOpen && setOpen(isOpen),
        contentProps: {
          className: 'max-w-[420px]',
        },
        footer: (
          <DialogClose className="flex-1 xs:flex-none" asChild>
            <Button className="flex-1 xs:flex-none">Sign in again</Button>
          </DialogClose>
        ),
        children: (
          <div className="flex flex-col gap-1">
            <Text size="sm" weight="medium" className="block">
              Your session has expired
            </Text>
            <Text size="sm" color="secondary" className="block">
              Sign in again to continue where you left off.
            </Text>
          </div>
        ),
      })}
    </>
  );
}

export const WithoutTitle: Story = {
  render: () => <WithoutTitleDemo />,
};

function LongContentDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open dialog with long content
      </Button>
      {makeResponsiveDialog({
        title: 'Terms of service',
        description: 'Review the terms before accepting',
        open,
        onClose: () => setOpen(false),
        onOpenChange: (isOpen) => !isOpen && setOpen(isOpen),
        contentProps: {
          className: 'max-w-[560px]',
        },
        footer: (
          <>
            <DialogClose className="flex-1 xs:flex-none" asChild>
              <Button
                variant="outline"
                className="flex-1 xs:flex-none"
                icon={<Icon icon="close" />}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="flex-1 xs:flex-none"
              onClick={() => setOpen(false)}
            >
              Accept
            </Button>
          </>
        ),
        children: (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 24 }, (_, index) => (
              <Text
                key={`clause-${index + 1}`}
                size="sm"
                color="secondary"
                className="block"
              >
                Clause {index + 1}. The dialog caps its height to the viewport,
                the body scrolls internally, and the header and footer stay
                pinned so the actions are always reachable.
              </Text>
            ))}
          </div>
        ),
      })}
    </>
  );
}

export const LongContent: Story = {
  render: () => <LongContentDemo />,
};
