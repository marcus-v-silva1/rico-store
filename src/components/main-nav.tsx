"use client";

import { usePathname } from "next/navigation";
import { NavLink } from "./nav-link";
import { cn } from "@/lib/utils";

export type NavItem = { slug: string; title: string };

/** Menu das linhas da loja; a linha aberta fica sublinhada. */
export function MainNav({ items, className }: { items: readonly NavItem[]; className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className={className}>
      <ul className="flex items-center gap-5">
        {items.map((item) => {
          const href = `/colecao/${item.slug}`;
          const active = pathname === href;
          return (
            <li key={item.slug}>
              <NavLink
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-block py-1 text-[0.8125rem] whitespace-nowrap border-b",
                  active ? "border-bone font-semibold" : "border-transparent text-bone/80 hover:text-bone",
                )}
              >
                {item.title}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Mesmo menu sem destaque, para o servidor desenhar antes de saber a rota. */
export function MainNavFallback({ items, className }: { items: readonly NavItem[]; className?: string }) {
  return (
    <nav aria-label="Principal" className={className}>
      <ul className="flex items-center gap-5">
        {items.map((item) => (
          <li key={item.slug}>
            <NavLink
              href={`/colecao/${item.slug}`}
              className="inline-block border-b border-transparent py-1 text-[0.8125rem] whitespace-nowrap text-bone/80"
            >
              {item.title}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
