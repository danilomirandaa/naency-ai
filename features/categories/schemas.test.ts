import { describe, expect, it } from 'vitest';
import { parseCategoryForm } from './schemas';

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }
  return data;
}

describe('parseCategoryForm', () => {
  it('normaliza nome, pai vazio e cor', () => {
    expect(
      parseCategoryForm(
        form({ name: ' Mercado ', kind: 'expense', parentId: '', icon: 'category-market', color: '#16a34a' }),
      ),
    ).toEqual({
      success: true,
      data: { name: 'Mercado', kind: 'expense', parentId: null, icon: 'category-market', color: '#16A34A' },
    });
  });

  it('erro por campo, com os valores digitados', () => {
    const result = parseCategoryForm(
      form({ name: '', kind: 'x', parentId: 'nao-uuid', icon: 'bank', color: 'red' }),
    );
    expect(result).toEqual({
      status: 'error',
      message: 'Revise os campos destacados.',
      fieldErrors: {
        name: 'Dê um nome à categoria.',
        kind: 'Escolha receita ou despesa.',
        parentId: 'Categoria principal inválida.',
        icon: 'Escolha um ícone.',
        color: 'Escolha uma cor.',
      },
      values: { name: '', kind: 'x', parentId: 'nao-uuid', icon: 'bank', color: 'red' },
    });
  });
});
