import Link from 'next/link';
import { type HTMLAttributes, forwardRef, useRef } from 'react';

import { twMerge } from 'tailwind-merge';

import { Text, type TextSize } from '@/components/ui/Text';
import { Tooltip } from '@/components/ui/Tooltip';
import ExternalLinkIcon from '@/components/ui/animated-icons/ExternalLinkIcon';
import LinkIcon from '@/components/ui/animated-icons/LinkIcon';
import type { AnimatedIconHandle } from '@/components/ui/animated-icons/types';

type NextLinkProps = Parameters<typeof Link>[0];

type SimpleLinkProps<T> = (T extends true
  ? HTMLAttributes<HTMLButtonElement>
  : NextLinkProps) & {
  children?: string;
  isExternalLink?: boolean;
  isLegacyAnchor?: boolean;
  asButton?: T;
  textClassNames?: string;
  iconClassNames?: string;
  size?: TextSize;
  noTooltip?: boolean;
  tooltipMessage?: string;
  tooltipSide?: React.ComponentPropsWithoutRef<typeof Tooltip>['side'];
};

export const SimpleLink = forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  SimpleLinkProps<boolean>
>(
  (
    {
      children,
      className,
      isExternalLink = false,
      isLegacyAnchor = false,
      asButton,
      textClassNames,
      iconClassNames,
      size = 'inherit',
      noTooltip = true,
      tooltipMessage,
      tooltipSide = 'right',
      ...rest
    },
    ref,
  ) => {
    const classes = twMerge(
      'group tracking-wide font-inter font-light',
      className,
    );

    const iconRef = useRef<AnimatedIconHandle>(null);

    const hoverHandlers = {
      onMouseEnter: () => iconRef.current?.startAnimation(),
      onMouseLeave: () => iconRef.current?.stopAnimation(),
    };

    const addTooltip =
      children && !noTooltip
        ? ({ children }: { children: React.ReactNode }) => (
            <Tooltip
              content={
                <div
                  style={{ '--text-link': 'currentColor' } as React.CSSProperties}
                >
                  {tooltipMessage ?? children}
                </div>
              }
              side={tooltipSide}
              disabled={noTooltip}
            >
              {children}
            </Tooltip>
          )
        : ({ children }: { children: React.ReactNode }) => children;

    const content = addTooltip({
      children: (
        <span className="group text-text-link transition-opacity duration-150 group-hover:opacity-70">
          <Text
            size={size}
            className={twMerge(
              'flex items-center gap-1.5 break-all text-text-link',
              textClassNames,
            )}
          >
            {isExternalLink ? (
              <ExternalLinkIcon
                ref={iconRef}
                className={twMerge('size-3.5 shrink-0', iconClassNames)}
              />
            ) : (
              <LinkIcon
                ref={iconRef}
                className={twMerge('size-3.5 shrink-0', iconClassNames)}
              />
            )}
            {children}
          </Text>
        </span>
      ),
    });

    if (asButton) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          className={classes}
          {...(rest as HTMLAttributes<HTMLButtonElement>)}
          {...hoverHandlers}
        >
          {content}
        </button>
      );
    }

    if (isExternalLink) {
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          target="_blank"
          {...(rest as NextLinkProps)}
          {...hoverHandlers}
        >
          <span className={classes}>{content}</span>
        </Link>
      );
    }

    if (isLegacyAnchor) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={classes}
          {...(rest as HTMLAttributes<HTMLAnchorElement>)}
          {...hoverHandlers}
        >
          {content}
        </a>
      );
    }

    return (
      <Link
        className={classes}
        ref={ref as React.Ref<HTMLAnchorElement>}
        {...(rest as NextLinkProps)}
        {...hoverHandlers}
      >
        <span className={classes}>{content}</span>
      </Link>
    );
  },
);

SimpleLink.displayName = 'SimpleLink';
