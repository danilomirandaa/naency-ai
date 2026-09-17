// Toda tabela nasce com RLS ligado e sem policies: anon e authenticated não
// leem nada pela API pública do Supabase. O app acessa pelo DAL (docs/architecture.md).
export * from './workspaces';
export * from './accounts';
