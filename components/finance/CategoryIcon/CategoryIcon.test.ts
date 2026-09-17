import { icons } from '@/components/ui/Icon/icons';
import { CATEGORY_ICONS } from '@/lib/categories';
import { describe, expect, it } from 'vitest';

describe('ícones de categoria', () => {
  it('todo nome de CATEGORY_ICONS existe no registro de ícones', () => {
    for (const name of CATEGORY_ICONS) {
      expect(icons, name).toHaveProperty(name);
    }
  });
});
