/**
 * jsPDF's standard fonts only cover WinAnsiEncoding. A single character
 * outside it makes jsPDF switch the whole string to 2-byte encoding, which
 * those fonts render as spaced-out garbage — so map everything to WinAnsi
 * before it reaches the PDF.
 */

/** WinAnsi's 0x80–0x9F block, beyond ASCII and Latin-1. */
const WIN_ANSI_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ')

/** Characters NFKD can't reduce to WinAnsi but that have an obvious stand-in. */
const FALLBACKS: Record<string, string> = {
  '→': '->',
  '←': '<-',
  '↔': '<->',
  '⇒': '=>',
  '≥': '>=',
  '≤': '<=',
  '≠': '!=',
  '≈': '~',
  '−': '-',
  '‐': '-',
  '‑': '-',
  '‒': '-',
  '―': '—',
  '′': "'",
  '″': '"',
  '●': '•',
  '◦': '•',
  '▪': '•',
  '■': '•',
  '‣': '•',
  '⁃': '-',
  '★': '*',
  '☆': '*',
  Ł: 'L',
  ł: 'l',
  Đ: 'D',
  đ: 'd',
  Ħ: 'H',
  ħ: 'h',
  ı: 'i',
  '\u2009': ' ',
  '\u202F': ' ',
  '\u200B': '',
}

function isWinAnsi(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0
  return (
    ch === '\n' ||
    ch === '\r' ||
    ch === '\t' ||
    (code >= 0x20 && code <= 0x7e) ||
    (code >= 0xa0 && code <= 0xff) ||
    WIN_ANSI_EXTRA.has(ch)
  )
}

function fallbackFor(ch: string): string {
  const mapped = FALLBACKS[ch]
  if (mapped !== undefined) return mapped

  // Strip accents the fonts can't draw (ő → o) and unfold ligatures (ﬁ → fi)
  const decomposed = ch.normalize('NFKD').replace(/\p{M}/gu, '')
  if (decomposed && [...decomposed].every(isWinAnsi)) return decomposed

  // Mark lost letters/digits so the gap is visible; drop emoji and symbols
  return /[\p{L}\p{N}]/u.test(ch) ? '?' : ''
}

export function toWinAnsi(text: string): string {
  let out = ''
  for (const ch of text) {
    out += isWinAnsi(ch) ? ch : fallbackFor(ch)
  }
  return out
}
