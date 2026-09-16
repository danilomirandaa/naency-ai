import { z } from 'zod';

const supabasePublicEnvSchema = z.object({
  url: z.url({ error: 'NEXT_PUBLIC_SUPABASE_URL ausente ou inválida' }),
  publishableKey: z
    .string({ error: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ausente' })
    .min(1, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ausente'),
});

export type SupabasePublicEnv = z.infer<typeof supabasePublicEnvSchema>;

/**
 * Variáveis públicas do Supabase (podem ir para o navegador). Exceção à regra
 * de `process.env` só em `server/`: o Next só embute NEXT_PUBLIC_* no bundle do
 * cliente quando acessadas estaticamente, por isso a leitura fica aqui.
 * Validação preguiçosa: o build não quebra sem as variáveis, só o uso.
 */
export function getSupabasePublicEnv(
  env: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
): SupabasePublicEnv {
  const result = supabasePublicEnvSchema.safeParse({
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!result.success) {
    const problems = result.error.issues.map((issue) => issue.message).join('; ');
    throw new Error(`Configuração do Supabase inválida: ${problems}. Veja .env.local.`);
  }

  return result.data;
}
