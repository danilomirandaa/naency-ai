import type { CategoryIconName, CategoryKind } from '@/lib/categories';

export type CategorySummary = {
  id: string;
  parentId: string | null;
  name: string;
  kind: CategoryKind;
  icon: CategoryIconName;
  color: string;
  archived: boolean;
};
