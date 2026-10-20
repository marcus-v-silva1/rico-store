import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CollectionView, collectionShell } from "@/components/collection-view";
import { PageTransition } from "@/components/page-transition";
import { getCategoryPage, getCategorySlugs, getCollections } from "@/lib/catalog/queries";

// Cache Components exige ao menos um parâmetro; slug inexistente cai no notFound().
export async function generateStaticParams() {
  const slugs = await getCategorySlugs();
  return slugs.length > 0 ? slugs.map((slug) => ({ slug })) : [{ slug: "camisetas" }];
}

export async function generateMetadata({ params }: PageProps<"/categoria/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCategoryPage(slug);
  return page ? { title: page.title, description: page.description } : {};
}

// `params` é dado da URL: lido dentro do Suspense, o cabeçalho e a moldura aparecem na hora.
export default function CategoryPage({ params }: PageProps<"/categoria/[slug]">) {
  return (
    <PageTransition>
      <Suspense fallback={<div className={collectionShell} aria-busy="true" />}>
        <Category params={params} />
      </Suspense>
    </PageTransition>
  );
}

async function Category({ params }: { params: PageProps<"/categoria/[slug]">["params"] }) {
  const { slug } = await params;
  const [page, strip] = await Promise.all([getCategoryPage(slug), getCollections()]);
  if (!page) notFound();
  // A faixa lista as coleções; nenhuma fica marcada (sneakers existe como coleção e como categoria).
  return <CollectionView page={page} strip={strip} activeSlug="" basePath="/colecao" />;
}
