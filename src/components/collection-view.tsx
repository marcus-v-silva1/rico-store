import type { CatalogPage, NavItem } from "@/lib/catalog/queries";
import { cn } from "@/lib/utils";
import { NavLink } from "./nav-link";
import { ProductCard } from "./product-card";

export const collectionShell = "mx-auto max-w-[88rem] px-(--gutter) py-12";

/** Corpo das páginas de coleção e de categoria. */
export function CollectionView({
  page,
  strip,
  activeSlug,
  basePath,
}: {
  page: CatalogPage;
  strip: NavItem[];
  activeSlug: string;
  basePath: "/colecao" | "/categoria";
}) {
  return (
    <div className={collectionShell}>
      <p className="label text-stone">{page.kicker}</p>
      <h1 className="display mt-3 text-[clamp(2.75rem,8vw,5.5rem)]">{page.title}</h1>
      <p className="mt-4 max-w-xl text-sm text-ink/80">{page.description}</p>

      {/* Outras coleções: faixa que se arrasta na horizontal */}
      {strip.length > 0 && (
        <nav
          aria-label="Coleções"
          className="mt-8 -mx-(--gutter) overflow-x-auto px-(--gutter) [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex gap-2">
            {strip.map((c) => (
              <li key={c.slug}>
                <NavLink
                  href={`${basePath}/${c.slug}`}
                  aria-current={c.slug === activeSlug ? "page" : undefined}
                  className={cn(
                    "inline-block border px-3 py-1.5 text-xs font-semibold whitespace-nowrap",
                    c.slug === activeSlug ? "border-ink bg-ink text-bone" : "border-ink/30 hover:border-ink",
                  )}
                >
                  {c.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {page.products.length > 0 ? (
        <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 lg:grid-cols-4">
          {page.products.map((product) => (
            <li key={product.slug}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-12 text-sm text-stone">Ainda não há peças aqui. Volte em breve.</p>
      )}
    </div>
  );
}
