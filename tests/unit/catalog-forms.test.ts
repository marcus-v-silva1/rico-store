import { describe, expect, it } from "vitest";
import { slugify, buildSku } from "@/lib/catalog/slug";
import { sortSizes, SIZE_PRESETS } from "@/lib/catalog/sizes";
import { parseVariantGrid } from "@/lib/catalog/variant-grid";
import { publishProblems } from "@/lib/catalog/publish";
import { checkImageFile, imagePath } from "@/lib/catalog/images";
import { categoryFormSchema, collectionFormSchema, colorFormSchema, productFormSchema } from "@/lib/catalog/schemas";

const cell = (colorId: string, size: string, raw: string) => ({ colorId, size, raw });

const validProduct = {
  name: "Camiseta Oversized",
  slug: "camiseta-oversized",
  detail: "Algodão pesado",
  description: "Modelagem larga.",
  categoryId: "3f2b8c1e-5d4a-4b7c-9e1f-2a6d8c0b1e34",
  priceCents: 12990,
  weightGrams: 300,
  isNew: true,
  garment: "tee",
  status: "rascunho",
  collectionIds: [],
};

describe("slug e sku", () => {
  it("slugify tira acentos e símbolos", () => {
    expect(slugify("Calça Cargo  Baggy!")).toBe("calca-cargo-baggy");
    expect(slugify("  Boné — aba curva ")).toBe("bone-aba-curva");
  });
  it("buildSku junta produto, cor e tamanho", () => {
    expect(buildSku("camiseta-oversized", "branco", " m ")).toBe("camiseta-oversized-branco-m");
  });
});

describe("tamanhos", () => {
  it("presets", () => {
    expect(SIZE_PRESETS.roupa).toEqual(["PP", "P", "M", "G", "GG", "XG"]);
    expect(SIZE_PRESETS.calcado[0]).toBe("34");
    expect(SIZE_PRESETS.calcado).toHaveLength(13);
    expect(SIZE_PRESETS.unico).toEqual(["U"]);
  });
  it("sortSizes ordena pelos presets e o resto por último, sem repetir", () => {
    expect(sortSizes(["G", "XG", "P", "M", "38", "Único", "P"])).toEqual(["P", "M", "G", "XG", "38", "Único"]);
  });
});

describe("grade de variantes", () => {
  it("ignora células vazias e lê números", () => {
    expect(parseVariantGrid([cell("a", "M", "3"), cell("a", "G", "")])).toEqual({
      ok: true,
      variants: [{ colorId: "a", size: "M", stock: 3 }],
    });
    expect(parseVariantGrid([cell("a", "M", " 0 ")])).toEqual({
      ok: true,
      variants: [{ colorId: "a", size: "M", stock: 0 }],
    });
  });
  it("apara o tamanho na saída", () => {
    expect(parseVariantGrid([cell("a", " M ", "2")])).toEqual({
      ok: true,
      variants: [{ colorId: "a", size: "M", stock: 2 }],
    });
  });
  it("rejeita valores inválidos", () => {
    for (const bad of ["abc", "-1", "2.5", "1e3"]) {
      const r = parseVariantGrid([cell("a", "M", bad)]);
      expect(r.ok).toBe(false);
      if (!r.ok)
        expect(r.errors[0]).toMatchObject({
          colorId: "a",
          size: "M",
          message: "Use um número inteiro, 0 ou mais.",
        });
    }
  });
});

describe("publicação e fotos", () => {
  it("publishProblems", () => {
    expect(publishProblems({ variants: [{ stock: 0 }], imageCount: 0 })).toEqual([
      "Cadastre estoque em pelo menos uma cor e tamanho.",
      "Envie pelo menos uma foto.",
    ]);
    expect(publishProblems({ variants: [{ stock: 1 }], imageCount: 1 })).toEqual([]);
  });
  it("checkImageFile", () => {
    expect(checkImageFile({ type: "image/webp", size: 1000 })).toBeNull();
    expect(checkImageFile({ type: "application/pdf", size: 1000 })).toBe("Envie uma foto em JPEG, PNG ou WebP.");
    expect(checkImageFile({ type: "image/png", size: 5 * 1024 * 1024 + 1 })).toBe(
      "A foto passa de 5 MB. Diminua e envie de novo.",
    );
    expect(checkImageFile({ type: "image/jpeg", size: 0 })).toBe("Envie uma foto em JPEG, PNG ou WebP.");
  });
  it("imagePath usa a extensão do tipo do arquivo, não do nome", () => {
    expect(imagePath("p1", "image/jpeg", "x9")).toBe("p1/x9.jpg");
    expect(imagePath("p1", "image/png", "x9")).toBe("p1/x9.png");
    expect(imagePath("p1", "image/webp", "x9")).toBe("p1/x9.webp");
    expect(() => imagePath("p1", "application/pdf", "x9")).toThrow();
  });
});

describe("schemas", () => {
  it("produto válido passa; preço zero e slug ruim não", () => {
    expect(productFormSchema.safeParse(validProduct).success).toBe(true);
    expect(productFormSchema.safeParse({ ...validProduct, priceCents: 0 }).success).toBe(false);
    expect(productFormSchema.safeParse({ ...validProduct, slug: "Com Espaço" }).success).toBe(false);
  });
  it("cor converte hex para minúsculas", () => {
    expect(colorFormSchema.safeParse({ slug: "grafite", label: "Grafite", hex: "#2A2A2A" }).data?.hex).toBe("#2a2a2a");
    expect(colorFormSchema.safeParse({ slug: "x", label: "X", hex: "2a2a2a" }).success).toBe(false);
  });
  it("categoria e coleção válidas", () => {
    expect(
      categoryFormSchema.safeParse({
        name: "Camisetas",
        slug: "camisetas",
        kicker: "",
        description: "",
        garment: "tee",
        showOnHome: true,
      }).success,
    ).toBe(true);
    expect(
      collectionFormSchema.safeParse({
        title: "Verão",
        slug: "verao",
        kicker: "",
        description: "",
        showInNav: false,
      }).success,
    ).toBe(true);
  });
});
