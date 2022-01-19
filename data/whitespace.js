// unicode category Zs
const spaceSeparator = '\u0020\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000';

export const whiteSpaceRegex = new RegExp(
  '[' + '\u0009' + '\u000b' + '\u000c' + '\ufeff' + spaceSeparator + ']',
);

export function isWhiteSpace(code) {
  const ch = String.fromCodePoint(code);
  return whiteSpaceRegex.test(ch);
}

export function isLineTerminator(code) {
  return code === 10 || code === 13 || code === 0x2028 || code === 0x2029;
}
