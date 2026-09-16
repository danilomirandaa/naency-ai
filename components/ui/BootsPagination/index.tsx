'use client';
import { Icon } from '@/components/ui/Icon';
import { buttonVariants } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/Pagination';
import { Text } from '@/components/ui/Text';
import { usePagination } from '@/hooks/usePagination';
import { classMerge } from '@/lib/utils';

type BootsPaginationProps = {
  page: number;
  count: number;
  onChange?: (page: number) => void;
  paginationItemsToDisplay?: number;
  showFirstButton?: boolean;
  showLastButton?: boolean;
  className?: string;
};

export function BootsPagination({
  page,
  count,
  onChange,
  paginationItemsToDisplay = 5,
  showFirstButton = true,
  showLastButton = true,
  className,
}: BootsPaginationProps) {
  const {
    pages,
    showLeftEllipsis,
    showRightEllipsis,
    leftEllipsisPages,
    rightEllipsisPages,
  } = usePagination({
    currentPage: page,
    totalPages: count,
    paginationItemsToDisplay,
  });

  const handleChange = (newPage: number) => {
    if (newPage < 1 || newPage > count) {
      return;
    }
    onChange?.(newPage);
  };

  return (
    <Pagination className={className}>
      <PaginationContent>
        {showFirstButton && (
          <PaginationItem>
            <PaginationLink
              aria-disabled={page === 1}
              size="icon"
              onClick={() => handleChange(1)}
              className="h-8 w-8 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            >
              <Icon icon="chevron-left-pipe" className="size-4" />
            </PaginationLink>
          </PaginationItem>
        )}

        <PaginationItem>
          <PaginationLink
            aria-disabled={page === 1}
            size="icon"
            onClick={() => handleChange(page - 1)}
            className="h-8 w-8 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          >
            <Icon icon="chevron-left" className="size-4" />
          </PaginationLink>
        </PaginationItem>

        {showLeftEllipsis && (
          <PaginationItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Show more pages"
                  className={classMerge(
                    buttonVariants({ variant: 'standalone', size: 'icon' }),
                    'h-8 w-8',
                  )}
                >
                  <Icon icon="dots" className="size-4" />
                  <span className="sr-only">More pages</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="max-h-64 min-w-10 overflow-y-auto"
                align="center"
              >
                {leftEllipsisPages.map((pageNum) => (
                  <DropdownMenuItem
                    key={pageNum}
                    onClick={() => handleChange(pageNum)}
                    className="cursor-pointer"
                  >
                    <Text size="sm">{pageNum}</Text>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </PaginationItem>
        )}

        {pages.map((p) => (
          <PaginationItem key={p}>
            <PaginationLink
              isActive={p === page}
              size="icon"
              onClick={() => handleChange(p)}
              className="h-8 w-8"
            >
              <Text size="xs">{p}</Text>
            </PaginationLink>
          </PaginationItem>
        ))}

        {showRightEllipsis && (
          <PaginationItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Show more pages"
                  className={classMerge(
                    buttonVariants({ variant: 'standalone', size: 'icon' }),
                    'h-8 w-8',
                  )}
                >
                  <Icon icon="dots" className="size-4" />
                  <span className="sr-only">More pages</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="max-h-64 min-w-10 overflow-y-auto"
                align="center"
              >
                {rightEllipsisPages.map((pageNum) => (
                  <DropdownMenuItem
                    key={pageNum}
                    onClick={() => handleChange(pageNum)}
                    className="cursor-pointer"
                  >
                    <Text size="sm">{pageNum}</Text>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </PaginationItem>
        )}

        <PaginationItem>
          <PaginationLink
            aria-disabled={page === count}
            onClick={() => handleChange(page + 1)}
            className="h-8 w-8 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          >
            <Icon icon="chevron-right" className="size-4" />
          </PaginationLink>
        </PaginationItem>

        {showLastButton && (
          <PaginationItem>
            <PaginationLink
              aria-disabled={page === count}
              onClick={() => handleChange(count)}
              className="h-8 w-8 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            >
              <Icon icon="chevron-right-pipe" className="size-4" />
            </PaginationLink>
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
