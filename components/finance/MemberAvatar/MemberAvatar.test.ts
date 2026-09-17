import { describe, expect, it } from 'vitest';
import { getInitials } from './index';

describe('getInitials', () => {
  it.each([
    ['Danilo Miranda', 'DM'],
    ['danilo', 'D'],
    ['  Ana   Paula  Souza ', 'AP'],
    ['', '?'],
  ])('%j → %s', (name, expected) => {
    expect(getInitials(name)).toBe(expected);
  });
});
