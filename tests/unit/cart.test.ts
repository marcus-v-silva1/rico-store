import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "@/lib/catalog/types";
import {
  MAX_QTY,
  addItem,
  catalogIndex,
  removeItem,
  sanitize,
  setQty,
  toLines,
  totalCents,
  totalQty,
  whatsappUrl,
} from "@/lib/cart";

const preto = { slug: "preto", label: "Preto", hex: "#121212" };
const oliva = { slug: "oliva", label: "Oliva", hex: "#5b6240" };
const branco = { slug: "branco", label: "Branco", hex: "#f6f5f1" };

function product(slug: string, name: string, priceCents: number, colors: CatalogProduct["colors"]): CatalogProduct {
  return {
    id: slug,
    slug,
    name,
    detail: "",
    priceCents,
    isNew: false,
    garment: "jacket",
    categorySlug: "x",
    colors,
    images: [],
    soldOut: colors.length === 0,
  };
}

const catalog = catalogIndex([
  product("jaqueta-puffer", "Jaqueta puffer", 52990, [preto, oliva]),
  product("bone-aba-curva", "Boné aba curva", 9990, [preto, branco]),
]);

describe("sacola", () => {
  it("soma a quantidade da mesma peça na mesma cor e separa cores diferentes", () => {
    let items = addItem([], "jaqueta-puffer", "preto");
    items = addItem(items, "jaqueta-puffer", "preto");
    items = addItem(items, "jaqueta-puffer", "oliva");
    expect(items).toEqual([
      { slug: "jaqueta-puffer", color: "preto", qty: 2 },
      { slug: "jaqueta-puffer", color: "oliva", qty: 1 },
    ]);
    expect(totalQty(items)).toBe(3);
  });

  it("limita a quantidade e remove com zero", () => {
    let items = addItem([], "bone-aba-curva", "preto");
    items = setQty(items, "bone-aba-curva", "preto", 99);
    expect(items[0].qty).toBe(MAX_QTY);
    expect(setQty(items, "bone-aba-curva", "preto", 0)).toEqual([]);
    expect(removeItem(items, "bone-aba-curva", "preto")).toEqual([]);
  });

  it("descarta lixo vindo do armazenamento", () => {
    const raw = [
      { slug: "jaqueta-puffer", color: "preto", qty: 2 },
      { slug: "jaqueta-puffer", color: "preto", qty: 5 }, // duplicado
      { slug: "bone-aba-curva", color: "preto", qty: -3 },
      { slug: "bone-aba-curva", color: "branco", qty: 500 },
      { slug: "", color: "preto", qty: 1 },
      { slug: "bone-aba-curva", color: 3, qty: 1 },
      null,
      "texto",
    ];
    expect(sanitize(raw)).toEqual([
      { slug: "jaqueta-puffer", color: "preto", qty: 2 },
      { slug: "bone-aba-curva", color: "branco", qty: MAX_QTY },
    ]);
    expect(sanitize("quebrado")).toEqual([]);
  });

  it("só mostra peças e cores que ainda estão à venda", () => {
    const lines = toLines(
      [
        { slug: "jaqueta-puffer", color: "preto", qty: 1 },
        { slug: "nao-existe", color: "preto", qty: 1 },
        { slug: "jaqueta-puffer", color: "vinho", qty: 1 }, // cor sem estoque ou desativada
      ],
      catalog,
    );
    expect(lines.map((l) => `${l.product.slug}/${l.color.slug}`)).toEqual(["jaqueta-puffer/preto"]);
    expect(totalQty(lines)).toBe(1);
  });

  it("calcula o total em centavos com o preço do catálogo", () => {
    const lines = toLines(
      [
        { slug: "jaqueta-puffer", color: "preto", qty: 2 },
        { slug: "bone-aba-curva", color: "branco", qty: 1 },
      ],
      catalog,
    );
    expect(totalCents(lines)).toBe(2 * 52990 + 9990);
  });

  it("monta o link do WhatsApp só com número válido", () => {
    const lines = toLines([{ slug: "bone-aba-curva", color: "branco", qty: 1 }], catalog);
    expect(whatsappUrl("[NÚMERO]", lines)).toBeNull();
    expect(whatsappUrl("(91) 99999-0000", [])).toBeNull();
    const url = whatsappUrl("(91) 99999-0000", lines)!;
    expect(url.startsWith("https://wa.me/91999990000?text=")).toBe(true);
    expect(decodeURIComponent(url)).toContain("1x Boné aba curva (Branco)");
  });
});
