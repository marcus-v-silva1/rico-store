import { describe, expect, it } from "vitest";
import { MAX_QTY, addItem, removeItem, sanitize, setQty, toLines, totalCents, totalQty, whatsappUrl } from "@/lib/cart";

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
      { slug: "nao-existe", color: "preto", qty: 1 },
      { slug: "bolsa-transversal", color: "vinho", qty: 1 }, // cor que a peça não tem
      { slug: "bone-aba-curva", color: "preto", qty: -3 },
      { slug: "bone-aba-curva", color: "branco", qty: 500 },
      null,
      "texto",
    ];
    expect(sanitize(raw)).toEqual([
      { slug: "jaqueta-puffer", color: "preto", qty: 2 },
      { slug: "bone-aba-curva", color: "branco", qty: MAX_QTY },
    ]);
    expect(sanitize("quebrado")).toEqual([]);
  });

  it("calcula o total em centavos", () => {
    const lines = toLines([
      { slug: "jaqueta-puffer", color: "preto", qty: 2 }, // 52990
      { slug: "bone-aba-curva", color: "branco", qty: 1 }, // 9990
    ]);
    expect(totalCents(lines)).toBe(2 * 52990 + 9990);
  });

  it("monta o link do WhatsApp só com número válido", () => {
    const lines = toLines([{ slug: "bone-aba-curva", color: "branco", qty: 1 }]);
    expect(whatsappUrl("[NÚMERO]", lines)).toBeNull();
    expect(whatsappUrl("(91) 99999-0000", [])).toBeNull();
    const url = whatsappUrl("(91) 99999-0000", lines)!;
    expect(url.startsWith("https://wa.me/91999990000?text=")).toBe(true);
    expect(decodeURIComponent(url)).toContain("1x Boné aba curva (Branco)");
  });
});
