import { NavLink } from "@/components/nav-link";

export type AdminSection = "painel" | "produtos" | "categorias" | "colecoes" | "cores" | "equipe";

const LINKS: { key: AdminSection; href: string; label: string }[] = [
  { key: "painel", href: "/admin", label: "Painel" },
  { key: "produtos", href: "/admin/produtos", label: "Produtos" },
  { key: "categorias", href: "/admin/categorias", label: "Categorias" },
  { key: "colecoes", href: "/admin/colecoes", label: "Coleções" },
  { key: "cores", href: "/admin/cores", label: "Cores" },
  { key: "equipe", href: "/admin/equipe", label: "Equipe" },
];

/** Menu da área de administração. No celular vira uma faixa que rola na horizontal. */
export function AdminNav({ current }: { current: AdminSection }) {
  return (
    <nav
      aria-label="Administração"
      className="-mx-(--gutter) mb-8 overflow-x-auto border-y border-ink/15 px-(--gutter)"
    >
      <ul className="flex min-w-max gap-6">
        {LINKS.map((l) => (
          <li key={l.key}>
            <NavLink
              href={l.href}
              aria-current={l.key === current ? "page" : undefined}
              className="label block border-b-2 border-transparent py-3 text-ink/70 hover:text-ink aria-[current=page]:border-ink aria-[current=page]:text-ink"
            >
              {l.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
