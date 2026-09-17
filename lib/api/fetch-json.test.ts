import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, fetchJson } from './fetch-json';

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(response: Response) {
  const fetchMock = vi.fn(async () => response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('fetchJson', () => {
  it('monta a query string sem valores vazios e devolve o JSON', async () => {
    const fetchMock = stubFetch(Response.json([{ id: 1 }]));
    await expect(
      fetchJson('/api/x', { arquivadas: true, oculto: false, nulo: null, pagina: 2 }),
    ).resolves.toEqual([{ id: 1 }]);
    expect(fetchMock).toHaveBeenCalledWith('/api/x?arquivadas=1&pagina=2', expect.anything());
  });

  it('sem parâmetros não adiciona "?"', async () => {
    const fetchMock = stubFetch(Response.json({}));
    await fetchJson('/api/x');
    expect(fetchMock).toHaveBeenCalledWith('/api/x', expect.anything());
  });

  it('status de erro vira ApiError com o status', async () => {
    stubFetch(new Response(null, { status: 403 }));
    await expect(fetchJson('/api/x')).rejects.toEqual(new ApiError(403, 'Falha ao carregar /api/x (403).'));
    await expect(fetchJson('/api/x')).rejects.toMatchObject({ status: 403 });
  });
});
