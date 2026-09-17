import { QueryClient } from '@tanstack/react-query';

/**
 * Defaults do app (docs/architecture.md): 30s de dado fresco e refetch ao voltar
 * para a aba, para quem só acompanha ver o que o outro membro lançou.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
      },
    },
  });
}
