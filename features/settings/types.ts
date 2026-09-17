export type AiUsageSummary = {
  /** Mês ("AAAA-MM") e totais de tokens por tarefa e modelo. */
  month: string;
  items: { task: string; model: string; calls: number; inputTokens: number; outputTokens: number }[];
};
