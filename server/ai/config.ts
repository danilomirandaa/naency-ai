import 'server-only';

/** Modelo padrão por tarefa (docs/import-and-onboarding.md): trocável por variável de ambiente. */
export const DEFAULT_AI_MODEL = 'claude-opus-5';

export type AiConfig = { enabled: boolean; models: { enrich: string } };

/** A AI só liga com `ANTHROPIC_API_KEY`; sem ela, o app funciona sem sugestões. */
export function getAiConfig(env: Record<string, string | undefined> = process.env): AiConfig {
  return {
    enabled: Boolean(env.ANTHROPIC_API_KEY?.trim()),
    models: { enrich: env.AI_MODEL_ENRICH?.trim() || DEFAULT_AI_MODEL },
  };
}
