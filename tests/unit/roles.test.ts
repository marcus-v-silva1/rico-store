import { describe, expect, it } from "vitest";
import { canAccess, homeFor, isProtected, isRole, postLoginPath, rolesAllowedFor, safeInternalPath } from "@/lib/roles";

describe("acesso por papel", () => {
  it("a área /admin é só do administrador", () => {
    expect(canAccess("admin", "/admin")).toBe(true);
    expect(canAccess("atendente", "/admin")).toBe(false);
    expect(canAccess("cliente", "/admin/equipe")).toBe(false);
  });

  it("o atendimento aceita atendente e administrador, não cliente", () => {
    expect(canAccess("atendente", "/atendimento")).toBe(true);
    expect(canAccess("admin", "/atendimento/fila")).toBe(true);
    expect(canAccess("cliente", "/atendimento")).toBe(false);
  });

  it("a conta vale para todo papel, mas exige login", () => {
    for (const role of ["admin", "atendente", "cliente"] as const) expect(canAccess(role, "/conta")).toBe(true);
    expect(canAccess(null, "/conta")).toBe(false);
    expect(canAccess(undefined, "/conta")).toBe(false);
  });

  it("rotas públicas não pedem papel", () => {
    expect(canAccess(null, "/")).toBe(true);
    expect(canAccess(null, "/colecao/street")).toBe(true);
    expect(rolesAllowedFor("/login")).toBeNull();
  });

  it("não confunde prefixos parecidos", () => {
    expect(isProtected("/administrador")).toBe(false);
    expect(isProtected("/contato")).toBe(false);
    expect(isProtected("/admin/")).toBe(true);
  });

  it("reconhece papéis válidos", () => {
    expect(isRole("admin")).toBe(true);
    expect(isRole("dono")).toBe(false);
    expect(isRole(undefined)).toBe(false);
  });
});

describe("depois do login", () => {
  it("cada papel cai na sua área", () => {
    expect(homeFor("admin")).toBe("/admin");
    expect(homeFor("atendente")).toBe("/atendimento");
    expect(homeFor("cliente")).toBe("/conta");
  });

  it("respeita o destino pedido quando o papel pode vê-lo", () => {
    expect(postLoginPath("admin", "/admin/equipe")).toBe("/admin/equipe");
    expect(postLoginPath("atendente", "/atendimento?x=1")).toBe("/atendimento?x=1");
  });

  it("ignora o destino que o papel não pode ver", () => {
    expect(postLoginPath("cliente", "/admin")).toBe("/conta");
    expect(postLoginPath("atendente", "/admin/equipe")).toBe("/atendimento");
  });

  it("não deixa o destino sair do site", () => {
    expect(safeInternalPath("//evil.com")).toBeNull();
    expect(safeInternalPath("https://evil.com")).toBeNull();
    expect(safeInternalPath("/\\evil.com")).toBeNull();
    expect(postLoginPath("admin", "//evil.com")).toBe("/admin");
    expect(postLoginPath("cliente", null)).toBe("/conta");
  });
});
