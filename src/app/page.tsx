import { HOME_CATEGORIES, PRODUCTS, getCollection } from "@/content/catalog";
import { isPlaceholder, SITE, BRANDS } from "@/content/site";
import { Garment } from "@/components/garment";
import { Carousel } from "@/components/carousel";
import { Hero } from "@/components/hero";
import { Marquee } from "@/components/marquee";
import { NavLink } from "@/components/nav-link";
import { PageTransition } from "@/components/page-transition";
import { PinnedGallery } from "@/components/pinned-gallery";
import { Reveal } from "@/components/reveal";
import { Typewriter } from "@/components/typewriter";
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
      <Hero />

      {/* Categorias ---------------------------------------------------------- */}
      <section className={`${container} py-14`} aria-labelledby="categorias">
        <Reveal>
          <h2 id="categorias" className="heading text-2xl">
            Comprar por categoria
          </h2>
        </Reveal>
        <ul className="rail mt-6">
          {HOME_CATEGORIES.map(({ slug, garment }, i) => {
            const c = getCollection(slug)!;
            return (
              <li key={slug}>
                <Reveal delay={i * 0.08}>
                  <NavLink href={`/colecao/${slug}`} className="group block">
                    <div className="grid aspect-[4/5] place-items-center bg-concrete">
                      <Garment
                        kind={garment}
                        color={garment === "tee" ? "#f6f5f1" : "#121212"}
                        className="size-[62%] transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-3"
                      />
                    </div>
                    <p className="mt-3 text-[0.8125rem] font-semibold">{c.title}</p>
                    <p className="label mt-1 text-[0.625rem] text-stone">{c.kicker}</p>
                  </NavLink>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Novidades ----------------------------------------------------------- */}
      <section className={`${container} pb-16`} aria-labelledby="novidades">
        <Reveal className="mb-6 flex items-baseline justify-between gap-4">
          <h2 id="novidades" className="heading text-2xl">
            Novidades em Street
          </h2>
          <NavLink
            href="/colecao/street"
            className="text-xs font-semibold whitespace-nowrap underline underline-offset-4"
          >
            Ver tudo em Street
          </NavLink>
        </Reveal>
        <Carousel
          label="Novidades"
          items={FEATURED.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        />
      </section>

      {/* Lookbook: a rolagem vertical vira deslocamento horizontal ------------ */}
      <PinnedGallery
        id="lookbook"
        title="Lookbook"
        subtitle="Como a galera usa as peças da loja no dia a dia."
        items={[
          <Photo key="1" slot="Lookbook 01" className="aspect-[3/4]" />,
          <Photo key="2" slot="Lookbook 02" className="aspect-[3/4]" />,
          <Photo key="3" slot="Lookbook 03" className="aspect-[3/4]" />,
          <div key="cta" className="flex aspect-[3/4] flex-col justify-between bg-graphite p-5">
            <p className="script text-[3.25rem]">
              Seu look
              <br />
              aqui.
            </p>
            <div>
              <p className="text-xs text-bone/70">Marque @{SITE.instagram} nas suas fotos pra aparecer no lookbook.</p>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex h-9 items-center border border-bone/70 px-3.5 text-xs font-semibold hover:border-bone hover:bg-bone/10"
              >
                Ver no Instagram
              </a>
            </div>
          </div>,
        ]}
      />

      {/* Manifesto ----------------------------------------------------------- */}
      <section
        className={`${container} grid gap-10 py-20 lg:grid-cols-[1fr_auto] lg:items-end`}
        aria-labelledby="manifesto"
      >
        <div>
          <Typewriter
            id="manifesto"
            lines={["Same clothes,", "different stories."]}
            className="script text-[clamp(3.5rem,9vw,6.5rem)]"
          />
          <Reveal delay={0.15}>
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
          </Reveal>
        </div>
        <ul className="label space-y-3 text-[0.6875rem] text-ink/70">
          {["Marcas", "Tendências", "Qualidade", "Atendimento", "Confiança"].map((t, i) => (
            <li key={t}>
              <Reveal delay={0.1 * i}>{t}</Reveal>
            </li>
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
