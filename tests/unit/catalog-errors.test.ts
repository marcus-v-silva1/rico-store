import { describe, expect, it } from "vitest";
import { describeSaveError } from "@/lib/catalog/errors";
import { checkGrid, productFieldErrors, readGridCells } from "@/lib/catalog/product-form";
import { parsePriceToCents, productFormSchema } from "@/lib/catalog/schemas";

describe("describeSaveError", () => {
  it("traduz endereço repetido", () => {
    expect(
      describeSaveError({
        code: "23505",
        message: 'duplicate key value violates unique constraint "products_slug_key"',
      }),
    ).toBe("Já existe um produto com esse endereço. Mude o nome ou o endereço.");
  });
  it("traduz SKU repetido", () => {
    expect(describeSaveError({ code: "23505", message: '... "product_variants_sku_key"' })).toBe(
      "Esse código (SKU) já é usado por outra peça.",
    );
  });
  it("traduz falta de permissão", () => {
    expect(describeSaveError({ code: "42501" })).toBe("Você não tem permissão para salvar produtos.");
  });
  it("cai na mensagem genérica", () => {
    expect(describeSaveError({ code: "XX000" })).toBe("Não foi possível salvar. Tente de novo.");
    expect(describeSaveError(null)).toBe("Não foi possível salvar. Tente de novo.");
  });
});

describe("parsePriceToCents", () => {
  it("aceita vírgula, ponto e inteiro", () => {
    expect(parsePriceToCents("129,90")).toBe(12990);
    expect(parsePriceToCents("129.9")).toBe(12990);
    expect(parsePriceToCents("129")).toBe(12900);
  });
  it("recusa o resto", () => {
    expect(parsePriceToCents("12,999")).toBeNull();
    expect(parsePriceToCents("-5")).toBeNull();
    expect(parsePriceToCents("")).toBeNull();
  });
});

describe("grade do formulário", () => {
  const A = "3f2b8c1e-5d4a-4b7c-9e1f-2a6d8c0b1e34";
  it("lê as células e ignora coluna sem tamanho", () => {
    const fd = new FormData();
    fd.append("name", "x");
    fd.append(`stock:${A}:M`, "2");
    fd.append(`stock:${A}: `, "4");
    fd.append(`stock:${A}:`, "4");
    expect(readGridCells(fd.entries())).toEqual([{ colorId: A, size: "M", raw: "2" }]);
  });
  it("recusa estoque acima de 100000, tamanho longo e tamanho repetido", () => {
    const r = checkGrid([
      { colorId: A, size: "M", raw: "100001" },
      { colorId: A, size: "G", raw: "100000" },
      { colorId: A, size: "MUITOLONGO", raw: "1" },
      { colorId: A, size: "G ", raw: "1" },
    ]);
    expect(r).toEqual({
      ok: false,
      errors: [
        { colorId: A, size: "M", message: "Use no máximo 100000." },
        { colorId: A, size: "MUITOLONGO", message: "Use um tamanho de até 8 caracteres." },
        { colorId: A, size: "G", message: "Esse tamanho já está nesta cor." },
      ],
    });
  });
  it("mostra todos os erros juntos: texto inválido e estoque acima do limite", () => {
    expect(
      checkGrid([
        { colorId: A, size: "U", raw: "abc" },
        { colorId: A, size: "XGG", raw: "100001" },
      ]),
    ).toEqual({
      ok: false,
      errors: [
        { colorId: A, size: "U", message: "Use um número inteiro, 0 ou mais." },
        { colorId: A, size: "XGG", message: "Use no máximo 100000." },
      ],
    });
  });
  it("aceita a grade válida", () => {
    expect(checkGrid([{ colorId: A, size: "P", raw: " 0 " }])).toEqual({
      ok: true,
      variants: [{ colorId: A, size: "P", stock: 0 }],
    });
  });
  it("traduz os erros do zod por campo", () => {
    const parsed = productFormSchema.safeParse({
      name: "x",
      slug: "Ruim!",
      detail: "",
      description: "",
      categoryId: "",
      priceCents: 0,
      weightGrams: 0,
      isNew: false,
      garment: "tee",
      status: "outro",
      collectionIds: [],
      defaultColorId: "nao-e-id",
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(productFieldErrors(parsed.error)).toEqual({
      name: "Use pelo menos 2 caracteres.",
      slug: "Use só letras minúsculas, números e hífens.",
      categoryId: "Escolha uma categoria.",
      price: "Use um valor como 129,90.",
      weightGrams: "Use o peso em gramas, um número inteiro maior que zero.",
      status: "Escolha uma situação.",
      defaultColorId: "Escolha uma cor que está na grade.",
    });
  });
});
