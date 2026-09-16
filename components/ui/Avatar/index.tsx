'use client';

import { classMerge } from '@/lib/utils';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import type * as React from 'react';

export type AvatarRootProps = React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: 'sm' | 'default' | 'lg';
};
export type AvatarImageProps = React.ComponentProps<typeof AvatarPrimitive.Image>;
export type AvatarFallbackProps = React.ComponentProps<
  typeof AvatarPrimitive.Fallback
>;

function AvatarRoot({ className, size = 'default', ...props }: AvatarRootProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={classMerge(
        'group/avatar relative flex size-8 shrink-0 select-none overflow-hidden rounded-full data-[size=lg]:size-10 data-[size=sm]:size-6',
        className,
      )}
      {...props}
    />
  );
}
AvatarRoot.displayName = 'Avatar.Root';

function AvatarImage({ className, ...props }: AvatarImageProps) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={classMerge('aspect-square size-full', className)}
      {...props}
    />
  );
}
AvatarImage.displayName = 'Avatar.Image';

function AvatarFallback({ className, ...props }: AvatarFallbackProps) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={classMerge(
        'flex size-full items-center justify-center rounded-full bg-background-neutral-200 font-medium text-typography-neutral-secondary text-xs group-data-[size=lg]/avatar:text-sm',
        className,
      )}
      {...props}
    />
  );
}
AvatarFallback.displayName = 'Avatar.Fallback';

const Avatar = Object.assign(
  () => {
    throw new Error('Avatar is not a component. Render Avatar.Root instead.');
  },
  {
    Root: AvatarRoot,
    Image: AvatarImage,
    Fallback: AvatarFallback,
  },
);

export { Avatar, AvatarRoot, AvatarImage, AvatarFallback };
