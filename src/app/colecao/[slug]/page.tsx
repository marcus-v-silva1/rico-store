import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { COLLECTIONS, getCollection, productsIn } from "@/content/catalog";
import { NavLink } from "@/components/nav-link";
import { PageTransition } from "@/components/page-transition";
import { ProductCard } from "@/components/product-card";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/colecao/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  return collection ? { title: collection.title, description: collection.description } : {};
}

const shell = "mx-auto max-w-[88rem] px-(--gutter) py-12";

// `params` é dado da URL: lido dentro do Suspense, o cabeçalho e a moldura aparecem na hora.
export default function CollectionPage({ params }: PageProps<"/colecao/[slug]">) {
  return (
    <PageTransition>
      <Suspense fallback={<div className={shell} aria-busy="true" />}>
        <Collection params={params} />
      </Suspense>
    </PageTransition>
  );
}

async function Collection({ params }: { params: PageProps<"/colecao/[slug]">["params"] }) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();
  const products = productsIn(collection);

  return (
    <div className={shell}>
      <p className="label text-stone">{collection.kicker}</p>
      <h1 className="display mt-3 text-[clamp(2.75rem,8vw,5.5rem)]">{collection.title}</h1>
      <p className="mt-4 max-w-xl text-sm text-ink/80">{collection.description}</p>

      {/* Outras coleções: faixa que se arrasta na horizontal */}
      <nav
        aria-label="Coleções"
        className="mt-8 -mx-(--gutter) overflow-x-auto px-(--gutter) [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <ul className="flex gap-2">
          {COLLECTIONS.map((c) => (
            <li key={c.slug}>
              <NavLink
                href={`/colecao/${c.slug}`}
                aria-current={c.slug === slug ? "page" : undefined}
                className={cn(
                  "inline-block border px-3 py-1.5 text-xs font-semibold whitespace-nowrap",
                  c.slug === slug ? "border-ink bg-ink text-bone" : "border-ink/30 hover:border-ink",
                )}
              >
                {c.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {products.length > 0 ? (
        <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 lg:grid-cols-4">
          {products.map((product) => (
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
