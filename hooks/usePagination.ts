'use client';

import { useMemo } from 'react';

type UsePaginationProps = {
  currentPage: number;
  totalPages: number;
  paginationItemsToDisplay?: number;
};

/** Páginas visíveis e o que fica escondido nas reticências de cada lado. */
export function getPaginationRange({
  currentPage,
  totalPages,
  paginationItemsToDisplay = 5,
}: UsePaginationProps) {
  const visiblePages = Math.max(3, paginationItemsToDisplay);
  const half = Math.floor(visiblePages / 2);

  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, currentPage + half);

  if (end - start + 1 < visiblePages) {
    if (start === 1) {
      end = Math.min(totalPages, start + visiblePages - 1);
    } else if (end === totalPages) {
      start = Math.max(1, end - visiblePages + 1);
    }
  }

  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const showLeftEllipsis = start > 1;
  const showRightEllipsis = end < totalPages;

  const leftEllipsisPages = showLeftEllipsis
    ? Array.from({ length: start - 1 }, (_, i) => i + 1)
    : [];
  const rightEllipsisPages = showRightEllipsis
    ? Array.from({ length: totalPages - end }, (_, i) => end + i + 1)
    : [];

  return {
    pages,
    showLeftEllipsis,
    showRightEllipsis,
    leftEllipsisPages,
    rightEllipsisPages,
  };
}

export function usePagination({
  currentPage,
  totalPages,
  paginationItemsToDisplay = 5,
}: UsePaginationProps) {
  return useMemo(
    () =>
      getPaginationRange({ currentPage, totalPages, paginationItemsToDisplay }),
    [currentPage, totalPages, paginationItemsToDisplay],
  );
}
