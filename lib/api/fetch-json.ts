/** Erro de resposta HTTP de uma rota do app. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type SearchParams = Record<string, string | number | boolean | null | undefined>;

/** GET em uma rota do app. Parâmetros nulos ou `false` ficam fora da URL. */
export async function fetchJson<T>(path: string, params: SearchParams = {}): Promise<T> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== false) {
      search.set(key, value === true ? '1' : String(value));
    }
  }
  const query = search.toString();
  const response = await fetch(query ? `${path}?${query}` : path, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    throw new ApiError(response.status, `Falha ao carregar ${path} (${response.status}).`);
  }
  return response.json() as Promise<T>;
}
