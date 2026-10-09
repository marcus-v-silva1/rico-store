import { HOME_CATEGORIES, PRODUCTS, getCollection } from "@/content/catalog";
import { isPlaceholder, SITE, BRANDS } from "@/content/site";
import { Garment } from "@/components/garment";
import { Marquee } from "@/components/marquee";
import { NavLink } from "@/components/nav-link";
import { PageTransition } from "@/components/page-transition";
import { Photo } from "@/components/photo";
import { ProductCard } from "@/components/product-card";
import { LinkButton } from "@/components/ui/button";

const container = "mx-auto max-w-[88rem] px-(--gutter)";

// Novidades primeiro, sem perder a ordem do catálogo
const FEATURED = [...PRODUCTS].sort((a, b) => Number(b.isNew) - Number(a.isNew)).slice(0, 8);

const instagramUrl = isPlaceholder(SITE.instagram)
  ? "https://www.instagram.com/"
  : `https://www.instagram.com/${SITE.instagram}`;

export default function HomePage() {
  return (
    <PageTransition>
      {/* Hero ---------------------------------------------------------------- */}
      <section className="bg-ink text-bone" aria-labelledby="hero-title">
        <div className={`${container} grid gap-10 py-10 lg:min-h-[34rem] lg:grid-cols-[1.05fr_1fr] lg:gap-6`}>
          <div className="flex flex-col justify-between gap-12">
            <h1
              id="hero-title"
              className="display text-[clamp(2.5rem,11.5vw,4.5rem)] lg:text-[clamp(3.5rem,6vw,6.5rem)]"
            >
              Street
              <span className="outline-text block">Casual</span>
              <span className="outline-text block">Trabalho</span>
            </h1>
            <div className="max-w-lg">
              <p className="label text-bone/60">Streetwear / original vibe / sempre atual</p>
              <h2 className="heading mt-4 text-[clamp(1.5rem,3vw,2.125rem)]">
                As marcas que movem o streetwear, agora em Belém.
              </h2>
              <p className="mt-3 text-sm text-bone/70">
                Moletons, jaquetas, cargo e sneakers com qualidade e autenticidade.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <LinkButton href="/colecao/street" variant="light">
                  Ver coleção Street
                </LinkButton>
                <a
                  href="#lookbook"
                  className="inline-flex h-11 items-center justify-center border border-bone/70 px-5 text-[0.8125rem] font-semibold hover:border-bone hover:bg-bone/10"
                >
                  Ver looks
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Photo slot="Hero 01" className="aspect-[3/5] lg:aspect-auto" priority />
            <Photo slot="Hero 02" className="aspect-[3/5] lg:aspect-auto" priority />
          </div>
        </div>
      </section>

      {/* Categorias ---------------------------------------------------------- */}
      <section className={`${container} py-14`} aria-labelledby="categorias">
        <h2 id="categorias" className="heading text-2xl">
          Comprar por categoria
        </h2>
        <ul className="rail mt-6">
          {HOME_CATEGORIES.map(({ slug, garment }) => {
            const c = getCollection(slug)!;
            return (
              <li key={slug}>
                <NavLink href={`/colecao/${slug}`} className="group block">
                  <div className="grid aspect-[4/5] place-items-center bg-concrete">
                    <Garment
                      kind={garment}
                      color={garment === "tee" ? "#f6f5f1" : "#121212"}
                      className="size-[62%] transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-3 text-[0.8125rem] font-semibold">{c.title}</p>
                  <p className="label mt-1 text-[0.625rem] text-stone">{c.kicker}</p>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Novidades ----------------------------------------------------------- */}
      <section className={`${container} pb-16`} aria-labelledby="novidades">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="novidades" className="heading text-2xl">
            Novidades em Street
          </h2>
          <NavLink
            href="/colecao/street"
            className="text-xs font-semibold whitespace-nowrap underline underline-offset-4"
          >
            Ver tudo em Street
          </NavLink>
        </div>
        <ul className="rail mt-6 lg:gap-y-10">
          {FEATURED.map((product) => (
            <li key={product.slug}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </section>

      {/* Lookbook ------------------------------------------------------------ */}
      <section id="lookbook" className="scroll-mt-28 bg-ink py-14 text-bone" aria-labelledby="lookbook-title">
        <div className={container}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="lookbook-title" className="heading text-2xl">
              Lookbook
            </h2>
            <p className="text-xs text-bone/70">Como a galera usa as peças da loja no dia a dia.</p>
          </div>
          <ul className="rail mt-6">
            {["01", "02", "03"].map((n) => (
              <li key={n}>
                <Photo slot={`Lookbook ${n}`} className="aspect-[3/4]" />
              </li>
            ))}
            <li>
              <div className="flex aspect-[3/4] flex-col justify-between bg-graphite p-5">
                <p className="script text-[3.25rem]">
                  Seu look
                  <br />
                  aqui.
                </p>
                <div>
                  <p className="text-xs text-bone/70">
                    Marque @{SITE.instagram} nas suas fotos pra aparecer no lookbook.
                  </p>
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex h-9 items-center border border-bone/70 px-3.5 text-xs font-semibold hover:border-bone hover:bg-bone/10"
                  >
                    Ver no Instagram
                  </a>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Manifesto ----------------------------------------------------------- */}
      <section
        className={`${container} grid gap-10 py-20 lg:grid-cols-[1fr_auto] lg:items-end`}
        aria-labelledby="manifesto"
      >
        <div>
          <h2 id="manifesto" className="script text-[clamp(3.5rem,9vw,6.5rem)]">
            Same clothes,
            <br />
            different stories.
          </h2>
          <p className="mt-8 max-w-xl text-sm text-ink/80">
            A Rico Store é mais que uma loja, é um estilo de vida. Do streetwear ao casual e à roupa de trabalho, em
            Belém.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton href="/colecao/casual" variant="outline">
              Ver linha Casual
            </LinkButton>
            <LinkButton href="/colecao/trabalho" variant="outline">
              Ver linha Trabalho
            </LinkButton>
          </div>
        </div>
        <ul className="label space-y-3 text-[0.6875rem] text-ink/70">
          {["Marcas", "Tendências", "Qualidade", "Atendimento", "Confiança"].map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      {/* Marcas -------------------------------------------------------------- */}
      <section className="bg-ink pt-14 pb-16 text-bone" aria-labelledby="marcas">
        <div className={container}>
          <h2 id="marcas" className="mb-8 text-xs font-semibold text-bone/70">
            Marcas na loja
          </h2>
        </div>
        <Marquee items={BRANDS} />
      </section>
    </PageTransition>
  );
}
