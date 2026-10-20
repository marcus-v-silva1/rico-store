import { describe, expect, it } from "vitest";
import { formatBRL } from "@/lib/money";

describe("dinheiro", () => {
  it("formata centavos em reais", () => {
    expect(formatBRL(52990)).toBe("R$ 529,90");
    expect(formatBRL(5)).toBe("R$ 0,05");
  });
});
