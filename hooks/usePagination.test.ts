import { describe, expect, it } from 'vitest';
import { getPaginationRange } from './usePagination';

describe('getPaginationRange', () => {
  it('mostra todas as páginas quando cabem', () => {
    expect(getPaginationRange({ currentPage: 1, totalPages: 3 })).toEqual({
      pages: [1, 2, 3],
      showLeftEllipsis: false,
      showRightEllipsis: false,
      leftEllipsisPages: [],
      rightEllipsisPages: [],
    });
  });

  it('no início, completa a janela à direita e esconde o resto', () => {
    const range = getPaginationRange({ currentPage: 1, totalPages: 10 });
    expect(range.pages).toEqual([1, 2, 3, 4, 5]);
    expect(range.showLeftEllipsis).toBe(false);
    expect(range.rightEllipsisPages).toEqual([6, 7, 8, 9, 10]);
  });

  it('no meio, centraliza a página atual', () => {
    const range = getPaginationRange({ currentPage: 6, totalPages: 10 });
    expect(range.pages).toEqual([4, 5, 6, 7, 8]);
    expect(range.leftEllipsisPages).toEqual([1, 2, 3]);
    expect(range.rightEllipsisPages).toEqual([9, 10]);
  });

  it('no fim, completa a janela à esquerda', () => {
    const range = getPaginationRange({ currentPage: 10, totalPages: 10 });
    expect(range.pages).toEqual([6, 7, 8, 9, 10]);
    expect(range.showRightEllipsis).toBe(false);
  });

  it('nunca mostra menos de 3 páginas na janela', () => {
    const range = getPaginationRange({
      currentPage: 5,
      totalPages: 10,
      paginationItemsToDisplay: 1,
    });
    expect(range.pages).toEqual([4, 5, 6]);
  });

  it('com uma página só, não mostra reticências', () => {
    const range = getPaginationRange({ currentPage: 1, totalPages: 1 });
    expect(range.pages).toEqual([1]);
    expect(range.showLeftEllipsis || range.showRightEllipsis).toBe(false);
  });
});
