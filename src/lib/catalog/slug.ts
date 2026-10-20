/** Texto livre vira slug: sem acento, minúsculo, hífens entre palavras. */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildSku(productSlug: string, colorSlug: string, size: string): string {
  return [productSlug, colorSlug, slugify(size)].join("-");
}
