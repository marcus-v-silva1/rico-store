/** Papéis da loja e regras de acesso por rota. Puro: sem dependência de Supabase. */

export const ROLES = ["admin", "atendente", "cliente"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  atendente: "Atendente",
  cliente: "Cliente",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Área da loja e quem pode entrar nela. Rotas fora desta lista são públicas. */
export const AREAS = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/atendimento", roles: ["admin", "atendente"] },
  { prefix: "/conta", roles: ["admin", "atendente", "cliente"] },
] as const satisfies readonly { prefix: string; roles: readonly Role[] }[];

/** Primeira página de cada papel depois do login. */
const HOME: Record<Role, string> = {
  admin: "/admin",
  atendente: "/atendimento",
  cliente: "/conta",
};

export function homeFor(role: Role): string {
  return HOME[role];
}

function matches(pathname: string, prefix: string) {
  // "/administrador" não pode cair na área "/admin"
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Papéis aceitos na rota, ou `null` quando a rota é pública. */
export function rolesAllowedFor(pathname: string): readonly Role[] | null {
  const area = AREAS.find((a) => matches(pathname, a.prefix));
  return area ? area.roles : null;
}

export function isProtected(pathname: string): boolean {
  return rolesAllowedFor(pathname) !== null;
}

export function canAccess(role: Role | null | undefined, pathname: string): boolean {
  const allowed = rolesAllowedFor(pathname);
  if (!allowed) return true;
  return !!role && allowed.includes(role);
}

/** Aceita só caminhos internos; bloqueia `//outro-site.com` e URLs absolutas. */
export function safeInternalPath(path: string | null | undefined): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return null;
  return path;
}

/** Para onde mandar quem acabou de entrar: o `next` pedido, se o papel puder vê-lo. */
export function postLoginPath(role: Role, next?: string | null): string {
  const target = safeInternalPath(next);
  const pathname = target?.split(/[?#]/)[0] ?? "";
  return target && canAccess(role, pathname) ? target : homeFor(role);
}
