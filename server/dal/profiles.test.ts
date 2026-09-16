import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/server/db/client', () => ({ getDb: vi.fn() }));

const { defaultProfileName } = await import('./profiles');

describe('defaultProfileName', () => {
  it('usa a parte antes do @', () => {
    expect(defaultProfileName('danilo.miranda@exemplo.com')).toBe('danilo.miranda');
  });

  it('sem e-mail usa um nome genérico', () => {
    expect(defaultProfileName(null)).toBe('Usuário');
    expect(defaultProfileName('@exemplo.com')).toBe('Usuário');
  });
});
