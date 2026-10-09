import { describe, expect, it } from "vitest";
import {
  COLLECTIONS,
  COLORS,
  HOME_CATEGORIES,
  NAV_SLUGS,
  PRODUCTS,
  getCollection,
  productsIn,
} from "@/content/catalog";
import { formatBRL } from "@/lib/money";

describe("catálogo", () => {
  it("slugs de produto e de coleção são únicos", () => {
    const products = PRODUCTS.map((p) => p.slug);
    const collections = COLLECTIONS.map((c) => c.slug);
    expect(new Set(products).size).toBe(products.length);
    expect(new Set(collections).size).toBe(collections.length);
  });

  it("todo produto usa só cores cadastradas e preço positivo em centavos inteiros", () => {
    for (const p of PRODUCTS) {
      expect(p.colors.length).toBeGreaterThan(0);
      for (const c of p.colors) expect(COLORS).toHaveProperty(c);
      expect(Number.isInteger(p.priceCents)).toBe(true);
      expect(p.priceCents).toBeGreaterThan(0);
    }
  });

  it("toda coleção do menu e da home existe e tem produtos", () => {
    for (const slug of [...NAV_SLUGS, ...HOME_CATEGORIES.map((c) => c.slug)]) {
      const collection = getCollection(slug);
      expect(collection, slug).toBeDefined();
      expect(productsIn(collection!).length, slug).toBeGreaterThan(0);
    }
  });

  it("coleção desconhecida não existe", () => {
    expect(getCollection("nao-existe")).toBeUndefined();
  });
});

describe("dinheiro", () => {
  it("formata centavos em reais", () => {
    expect(formatBRL(52990)).toBe("R$ 529,90");
    expect(formatBRL(5)).toBe("R$ 0,05");
  });
});
