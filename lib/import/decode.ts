/**
 * Texto de um extrato a partir dos bytes do arquivo. Bancos brasileiros ainda
 * exportam em Windows-1252: tenta UTF-8 estrito e, se falhar, usa 1252.
 */
export function decodeStatement(bytes: ArrayBuffer | Uint8Array) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(view).replace(/^﻿/, '');
  } catch {
    return new TextDecoder('windows-1252').decode(view);
  }
}
