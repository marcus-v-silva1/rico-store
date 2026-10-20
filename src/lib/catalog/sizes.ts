export const SIZE_PRESETS = {
  roupa: ["PP", "P", "M", "G", "GG", "XG"],
  calcado: Array.from({ length: 13 }, (_, i) => String(34 + i)),
  unico: ["U"],
} as const satisfies Record<string, readonly string[]>;

const ORDER: readonly string[] = [...SIZE_PRESETS.roupa, ...SIZE_PRESETS.calcado, ...SIZE_PRESETS.unico];

/** Ordem dos presets; o que não estiver neles vai depois, em ordem alfabética. */
export function sortSizes(sizes: readonly string[]): string[] {
  const unique = [...new Set(sizes)];
  const known = unique.filter((s) => ORDER.includes(s)).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  const other = unique.filter((s) => !ORDER.includes(s)).sort((a, b) => a.localeCompare(b));
  return [...known, ...other];
}
