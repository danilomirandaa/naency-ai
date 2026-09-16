import { describe, expect, it } from 'vitest';
import { classMerge } from './utils';

describe('classMerge', () => {
  it('a classe do consumidor vence a padrão do componente', () => {
    expect(classMerge('px-2 text-sm', 'px-4')).toBe('text-sm px-4');
  });

  it('ignora valores falsos', () => {
    expect(classMerge('flex', false, undefined, null, 'gap-2')).toBe('flex gap-2');
  });

  it('resolve conflito entre raios customizados e do Tailwind', () => {
    expect(classMerge('rounded-lg', 'rounded-control')).toBe('rounded-control');
    expect(classMerge('rounded-control-sm', 'rounded-full')).toBe('rounded-full');
  });

  it('resolve conflito entre tamanhos de texto customizados e do Tailwind', () => {
    expect(classMerge('text-sm', 'text-body-md')).toBe('text-body-md');
  });

  it('não confunde cor de texto (token) com tamanho de texto', () => {
    expect(
      classMerge('text-sm text-typography-neutral-primary', 'text-typography-neutral-secondary'),
    ).toBe('text-sm text-typography-neutral-secondary');
  });

  it('resolve conflito entre sombras customizadas', () => {
    expect(classMerge('shadow-xs', 'shadow-panel-body')).toBe('shadow-panel-body');
  });
});
