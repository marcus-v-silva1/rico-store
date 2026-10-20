import { describe, expect, it } from "vitest";
import { mapProductRow } from "@/lib/catalog/map";
import type { ProductRow } from "@/lib/catalog/types";

const url = (p: string) => "https://cdn/" + p;

type VariantRow = ProductRow["variants"][number];

function v(
  slug: string,
  stock: number,
  o: { active?: boolean; colorActive?: boolean; sort?: number } = {},
): VariantRow {
  return {
    stock,
    active: o.active ?? true,
    color: {
      id: "id-" + slug,
      slug,
      label: slug,
      hex: "#000000",
      sort_order: o.sort ?? 0,
      active: o.colorActive ?? true,
    },
  };
}

function row(o: Partial<ProductRow> = {}): ProductRow {
  return {
    id: "id1",
    slug: "camiseta",
    name: "Camiseta",
    detail: "Algodão",
    price_cents: 10000,
    is_new: false,
    garment: "tee",
    category: { slug: "camisetas" },
    default_color_id: null,
    variants: [],
    images: [],
    ...o,
  };
}

describe("mapProductRow", () => {
  it("cores sem estoque somem e o produto continua à venda", () => {
    const p = mapProductRow(row({ variants: [v("preto", 2), v("cinza", 0)] }), url);
    expect(p.colors.map((c) => c.slug)).toEqual(["preto"]);
    expect(p.soldOut).toBe(false);
  });

  it("todo estoque zerado ou só variantes inativas vira esgotado", () => {
    expect(mapProductRow(row({ variants: [v("preto", 0)] }), url).soldOut).toBe(true);
    expect(mapProductRow(row({ variants: [v("preto", 4, { active: false })] }), url).soldOut).toBe(true);
  });

  it("cor desativada não aparece mesmo com estoque", () => {
    expect(mapProductRow(row({ variants: [v("vinho", 3, { colorActive: false })] }), url).colors).toEqual([]);
  });

  it("cores e fotos seguem sort_order e a foto vira URL pública", () => {
    const p = mapProductRow(
      row({
        variants: [v("azul", 1, { sort: 5 }), v("preto", 1, { sort: 0 })],
        images: [
          { path: "a/1.webp", alt: "b", sort_order: 1, color: null },
          { path: "a/0.webp", alt: "a", sort_order: 0, color: { slug: "preto" } },
        ],
      }),
      url,
    );
    expect(p.colors.map((c) => c.slug)).toEqual(["preto", "azul"]);
    expect(p.images).toEqual([
      { url: "https://cdn/a/0.webp", alt: "a", colorSlug: "preto" },
      { url: "https://cdn/a/1.webp", alt: "b", colorSlug: null },
    ]);
  });

  it("a cor principal vem primeiro e o resto segue sort_order", () => {
    const p = mapProductRow(
      row({
        default_color_id: "id-cinza",
        variants: [v("preto", 1, { sort: 1 }), v("vinho", 1, { sort: 5 }), v("cinza", 1, { sort: 3 })],
      }),
      url,
    );
    expect(p.colors.map((c) => c.slug)).toEqual(["cinza", "preto", "vinho"]);
  });

  it("cor principal sem estoque ou desativada não entra; vale a ordem normal", () => {
    const semEstoque = mapProductRow(
      row({ default_color_id: "id-cinza", variants: [v("preto", 1, { sort: 1 }), v("cinza", 0, { sort: 3 })] }),
      url,
    );
    expect(semEstoque.colors.map((c) => c.slug)).toEqual(["preto"]);
    const desativada = mapProductRow(
      row({
        default_color_id: "id-cinza",
        variants: [v("azul", 1, { sort: 6 }), v("cinza", 1, { sort: 3, colorActive: false })],
      }),
      url,
    );
    expect(desativada.colors.map((c) => c.slug)).toEqual(["azul"]);
  });

  it("cor repetida em vários tamanhos aparece uma vez", () => {
    const p = mapProductRow(row({ variants: [v("preto", 2), v("preto", 3)] }), url);
    expect(p.colors).toHaveLength(1);
  });

  it("copia os campos simples", () => {
    const p = mapProductRow(row(), url);
    expect(p).toMatchObject({
      id: "id1",
      slug: "camiseta",
      priceCents: 10000,
      isNew: false,
      garment: "tee",
      categorySlug: "camisetas",
      soldOut: true,
    });
  });
});
