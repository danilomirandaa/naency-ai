'use client';

import { Icon } from '@/components/ui/Icon';
import { classMerge } from '@/lib/utils';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'motion/react';
import Link from 'next/link';
import * as React from 'react';

type TabsVariant = 'primary' | 'secondary';
type TabsOrientation = 'horizontal' | 'vertical';
type TabsSize = 'medium' | 'small';

interface TabsContextValue {
  variant: TabsVariant;
  orientation: TabsOrientation;
  size: TabsSize;
  layoutId: string;
  selected?: string;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs parts must be rendered inside Tabs.Root');
  }
  return context;
}

interface TabsRootProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  variant?: TabsVariant;
  orientation?: TabsOrientation;
  size?: TabsSize;
}

function TabsRoot({
  variant = 'primary',
  orientation = 'horizontal',
  size = 'medium',
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: TabsRootProps) {
  const layoutId = React.useId();
  const [uncontrolledSelected, setUncontrolledSelected] =
    React.useState(defaultValue);
  const selected = value ?? uncontrolledSelected;

  return (
    <TabsContext.Provider
      value={{ variant, orientation, size, layoutId, selected }}
    >
      <TabsPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={(nextValue) => {
          setUncontrolledSelected(nextValue);
          onValueChange?.(nextValue);
        }}
        orientation={orientation}
        className={classMerge(
          'flex min-w-0 max-w-full gap-2',
          orientation === 'horizontal' ? 'flex-col' : 'flex-row',
          className,
        )}
        {...props}
      >
        {children}
      </TabsPrimitive.Root>
    </TabsContext.Provider>
  );
}
TabsRoot.displayName = 'Tabs.Root';

const listContainerVariants: Record<
  TabsVariant,
  Record<TabsOrientation, string>
> = {
  primary: {
    horizontal:
      'relative w-fit max-w-full rounded-control bg-background-neutral-200 dark:bg-background-neutral-100',
    vertical:
      'relative w-fit max-w-full rounded-control bg-background-neutral-200 dark:bg-background-neutral-100',
  },
  secondary: {
    horizontal: 'relative border-border-neutral-subtle border-b',
    vertical: 'relative border-border-neutral-subtle border-s',
  },
};

const listVariants: Record<TabsVariant, Record<TabsOrientation, string>> = {
  primary: {
    horizontal: 'inline-flex w-max min-w-full flex-row p-1',
    vertical: 'inline-flex flex-col gap-1 p-1',
  },
  secondary: {
    horizontal: 'inline-flex w-max min-w-full flex-row',
    vertical: 'inline-flex flex-col gap-1',
  },
};

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  containerClassName?: string;
}

function TabsList({ containerClassName, className, ...props }: TabsListProps) {
  const { variant, orientation } = useTabsContext();
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = React.useState({ start: false, end: false });
  const isVertical = orientation === 'vertical';

  const checkOverflow = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }

    const scrollSize = isVertical ? el.scrollHeight : el.scrollWidth;
    const clientSize = isVertical ? el.clientHeight : el.clientWidth;
    const OVERFLOW_TOLERANCE = 8;

    if (scrollSize <= clientSize + OVERFLOW_TOLERANCE) {
      if ((isVertical ? el.scrollTop : el.scrollLeft) !== 0) {
        el.scrollTo(isVertical ? { top: 0 } : { left: 0 });
      }
      setOverflow((prev) =>
        prev.start || prev.end ? { start: false, end: false } : prev,
      );
      return;
    }

    const scrollStart = isVertical ? el.scrollTop : el.scrollLeft;
    const start = scrollStart > OVERFLOW_TOLERANCE;
    const end = scrollStart + clientSize < scrollSize - OVERFLOW_TOLERANCE;

    setOverflow((prev) =>
      prev.start === start && prev.end === end ? prev : { start, end },
    );
  }, [isVertical]);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }

    checkOverflow();
    el.addEventListener('scroll', checkOverflow, { passive: true });

    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(el);
    if (el.firstElementChild) {
      resizeObserver.observe(el.firstElementChild);
    }

    return () => {
      el.removeEventListener('scroll', checkOverflow);
      resizeObserver.disconnect();
    };
  }, [checkOverflow]);

  const scrollBy = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }

    const size = isVertical ? el.clientHeight : el.clientWidth;
    const scrollSize = isVertical ? el.scrollHeight : el.scrollWidth;
    const maxScroll = Math.max(0, scrollSize - size);
    const current = isVertical ? el.scrollTop : el.scrollLeft;
    const next = Math.min(
      maxScroll,
      Math.max(0, current + direction * size * 0.8),
    );

    if (next === current) {
      return;
    }

    el.scrollTo({
      behavior: 'smooth',
      [isVertical ? 'top' : 'left']: next,
    });
  };

  const fadeStart = overflow.start ? '2.5rem' : '0px';
  const fadeEnd = overflow.end ? '2.5rem' : '0px';
  const maskImage =
    overflow.start || overflow.end
      ? `linear-gradient(to ${isVertical ? 'bottom' : 'right'}, transparent 0, black ${fadeStart}, black calc(100% - ${fadeEnd}), transparent 100%)`
      : undefined;

  return (
    <div
      className={classMerge(
        listContainerVariants[variant][orientation],
        containerClassName,
      )}
    >
      <div
        ref={scrollerRef}
        style={{ maskImage, WebkitMaskImage: maskImage }}
        className={classMerge(
          'overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          isVertical && 'h-full',
        )}
      >
        <TabsPrimitive.List
          className={classMerge(listVariants[variant][orientation], className)}
          {...props}
        />
      </div>

      {overflow.start && (
        <button
          type="button"
          tabIndex={-1}
          aria-label={isVertical ? 'Scroll tabs up' : 'Scroll tabs left'}
          onClick={() => scrollBy(-1)}
          className={classMerge(
            'absolute z-[2] inline-flex size-4 items-center justify-center rounded-full text-typography-neutral-primary outline-hidden transition-opacity hover:opacity-70',
            isVertical
              ? '-translate-x-1/2 top-1 left-1/2'
              : '-translate-y-1/2 start-1 top-1/2',
          )}
        >
          <Icon
            icon={isVertical ? 'chevron-up' : 'chevron-left'}
            className="size-4"
          />
        </button>
      )}

      {overflow.end && (
        <button
          type="button"
          tabIndex={-1}
          aria-label={isVertical ? 'Scroll tabs down' : 'Scroll tabs right'}
          onClick={() => scrollBy(1)}
          className={classMerge(
            'absolute z-[2] inline-flex size-4 items-center justify-center rounded-full text-typography-neutral-primary outline-hidden transition-opacity hover:opacity-70',
            isVertical
              ? '-translate-x-1/2 bottom-1 left-1/2'
              : '-translate-y-1/2 end-1 top-1/2',
          )}
        >
          <Icon
            icon={isVertical ? 'chevron-down' : 'chevron-right'}
            className="size-4"
          />
        </button>
      )}
    </div>
  );
}
TabsList.displayName = 'Tabs.List';

const tabVariants: Record<TabsVariant, string> = {
  primary: 'rounded-control-xs',
  secondary: 'rounded-none',
};

const indicatorVariants: Record<
  TabsVariant,
  Record<TabsOrientation, string>
> = {
  primary: {
    horizontal:
      'absolute inset-0 rounded-control-xs bg-background-neutral-000 shadow-xs',
    vertical:
      'absolute inset-0 rounded-control-xs bg-background-neutral-000 shadow-xs',
  },
  secondary: {
    horizontal:
      'absolute inset-x-0 bottom-[-1px] h-0.5 bg-background-brand-primary-rest',
    vertical:
      'absolute inset-y-0 start-[-1px] w-0.5 bg-background-brand-primary-rest',
  },
};

const tabSizeVariants: Record<TabsSize, string> = {
  medium: 'h-8 px-4 text-sm',
  small: 'h-6 px-3 text-xs',
};

type TabProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
  href?: string;
};

function Tab({ value, href, className, children, ...props }: TabProps) {
  const { variant, orientation, size, layoutId, selected } = useTabsContext();
  const isSelected = selected === value;

  const tabClassName = classMerge(
    'relative flex items-center justify-center gap-2 whitespace-nowrap text-center font-medium text-typography-neutral-secondary outline-hidden transition-colors',
    tabSizeVariants[size],
    'data-[state=active]:text-typography-neutral-primary',
    'disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:rounded-control-xs focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset',
    tabVariants[variant],
    orientation === 'vertical' && 'min-w-20',
    className,
  );

  const content = (
    <>
      {isSelected && (
        <motion.span
          layoutId={layoutId}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
          className={indicatorVariants[variant][orientation]}
        />
      )}
      <span className="relative z-[1] flex items-center gap-2">{children}</span>
    </>
  );

  if (href) {
    return (
      <TabsPrimitive.Trigger
        value={value}
        className={tabClassName}
        asChild
        // Aba-link navega para outra rota: não há painel para referenciar.
        aria-controls={undefined}
        {...props}
      >
        <Link href={href}>{content}</Link>
      </TabsPrimitive.Trigger>
    );
  }

  return (
    <TabsPrimitive.Trigger value={value} className={tabClassName} {...props}>
      {content}
    </TabsPrimitive.Trigger>
  );
}
Tab.displayName = 'Tabs.Tab';

type TabPanelProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Content
>;

function TabPanel({ className, ...props }: TabPanelProps) {
  const context = useTabsContext();

  return (
    <TabsPrimitive.Content
      className={classMerge(
        'outline-hidden focus-visible:ring-2 focus-visible:ring-ring/50',
        context.orientation === 'vertical' && 'flex-1',
        className,
      )}
      {...props}
    />
  );
}
TabPanel.displayName = 'Tabs.Panel';

const Tabs = Object.assign(
  () => {
    throw new Error('Tabs is not a component. Render Tabs.Root instead.');
  },
  {
    Root: TabsRoot,
    List: TabsList,
    Tab: Tab,
    Panel: TabPanel,
  },
);

export { Tabs, TabsRoot, TabsList, Tab, TabPanel };
export type { TabsRootProps, TabsListProps, TabProps, TabPanelProps };
export type { TabsVariant, TabsOrientation, TabsSize };
