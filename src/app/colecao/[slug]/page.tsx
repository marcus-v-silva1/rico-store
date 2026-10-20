import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CollectionView, collectionShell } from "@/components/collection-view";
import { PageTransition } from "@/components/page-transition";
import { getCollectionPage, getCollectionSlugs, getCollections } from "@/lib/catalog/queries";

// Cache Components exige ao menos um parâmetro; slug inexistente cai no notFound().
export async function generateStaticParams() {
  const slugs = await getCollectionSlugs();
  return slugs.length > 0 ? slugs.map((slug) => ({ slug })) : [{ slug: "street" }];
}

export async function generateMetadata({ params }: PageProps<"/colecao/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCollectionPage(slug);
  return page ? { title: page.title, description: page.description } : {};
}

// `params` é dado da URL: lido dentro do Suspense, o cabeçalho e a moldura aparecem na hora.
export default function CollectionPage({ params }: PageProps<"/colecao/[slug]">) {
  return (
    <PageTransition>
      <Suspense fallback={<div className={collectionShell} aria-busy="true" />}>
        <Collection params={params} />
      </Suspense>
    </PageTransition>
  );
}

async function Collection({ params }: { params: PageProps<"/colecao/[slug]">["params"] }) {
  const { slug } = await params;
  const [page, strip] = await Promise.all([getCollectionPage(slug), getCollections()]);
  if (!page) notFound();
  return <CollectionView page={page} strip={strip} activeSlug={slug} basePath="/colecao" />;
}
