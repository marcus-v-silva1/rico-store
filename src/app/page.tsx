import { isPlaceholder, SITE, BRANDS } from "@/content/site";
import { Garment } from "@/components/garment";
import { Carousel } from "@/components/carousel";
import { Hero } from "@/components/hero";
import { Marquee } from "@/components/marquee";
import { NavLink } from "@/components/nav-link";
import { PageTransition } from "@/components/page-transition";
import { PinnedGallery } from "@/components/pinned-gallery";
import { Typewriter } from "@/components/typewriter";
import { Wipe } from "@/components/wipe";
import { Photo } from "@/components/photo";
import { ProductCard } from "@/components/product-card";
import { LinkButton } from "@/components/ui/button";
import { getFeaturedProducts, getHomeCategories } from "@/lib/catalog/queries";

const container = "mx-auto max-w-[88rem] px-(--gutter)";
const EMPTY = "Ainda não há peças aqui. Volte em breve.";

const instagramUrl = isPlaceholder(SITE.instagram)
  ? "https://www.instagram.com/"
  : `https://www.instagram.com/${SITE.instagram}`;

export default async function HomePage() {
  // Leituras em cache: entram no shell estático da home.
  const [categories, featured] = await Promise.all([getHomeCategories(), getFeaturedProducts(8)]);
  return (
    <PageTransition>
      <Hero />

      {/* Categorias ---------------------------------------------------------- */}
      <section className={`${container} py-14`} aria-labelledby="categorias">
        <Wipe className="w-fit">
          <h2 id="categorias" className="heading text-2xl">
            Comprar por categoria
          </h2>
        </Wipe>
        {categories.length > 0 ? (
          <ul className="rail mt-6">
            {categories.map(({ slug, name, kicker, garment }) => (
              <li key={slug}>
                <NavLink href={`/categoria/${slug}`} className="group block">
                  <div className="grid aspect-[4/5] place-items-center bg-concrete">
                    <Garment
                      kind={garment}
                      color={garment === "tee" ? "#f6f5f1" : "#121212"}
                      className="size-[62%] transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-3"
                    />
                  </div>
                  <p className="mt-3 text-[0.8125rem] font-semibold">{name}</p>
                  <p className="label mt-1 text-[0.625rem] text-stone">{kicker}</p>
                </NavLink>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-stone">{EMPTY}</p>
        )}
      </section>

      {/* Novidades ----------------------------------------------------------- */}
      <section className={`${container} pb-16`} aria-labelledby="novidades">
        <Wipe className="mb-6 w-fit">
          <h2 id="novidades" className="heading text-2xl">
            Acabou de chegar
          </h2>
        </Wipe>
        {featured.length > 0 ? (
          <Carousel
            label="Novidades"
            items={featured.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          />
        ) : (
          <p className="text-sm text-stone">{EMPTY}</p>
        )}
      </section>

      {/* Lookbook: a rolagem vertical vira deslocamento horizontal ------------ */}
      <PinnedGallery
        id="lookbook"
        title="Lookbook"
        subtitle="Clientes da Rico usando as peças pelas ruas de Belém."
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
              <p className="text-xs text-bone/70">
                {isPlaceholder(SITE.instagram)
                  ? "Marque a Rico no Instagram nas suas fotos para aparecer no lookbook."
                  : `Marque @${SITE.instagram} nas suas fotos para aparecer no lookbook.`}
              </p>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex h-9 items-center border border-bone/70 px-3.5 text-xs font-semibold hover:border-bone hover:bg-bone/10"
              >
                Abrir o Instagram
              </a>
            </div>
          </div>,
        ]}
      />

      {/* Manifesto ----------------------------------------------------------- */}
      <section className={`${container} py-20`} aria-labelledby="manifesto">
        <div>
          <Typewriter
            id="manifesto"
            lines={["Same clothes,", "different stories."]}
            className="script text-[clamp(3.5rem,9vw,6.5rem)]"
          />
          <div>
            <p className="mt-8 max-w-xl text-sm text-ink/80">
              A mesma jaqueta conta uma história diferente em cada pessoa. A gente traz as marcas de streetwear, casual
              e roupa de trabalho para Belém; o jeito de usar é seu.
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
        </div>
      </section>

      {/* Marcas -------------------------------------------------------------- */}
      <section className="bg-ink pt-14 pb-16 text-bone" aria-labelledby="marcas">
        <div className={container}>
          <Wipe tone="bone" className="mb-8 w-fit">
            <h2 id="marcas" className="heading text-2xl">
              Marcas na loja
            </h2>
          </Wipe>
        </div>
        <Marquee items={BRANDS} />
      </section>
    </PageTransition>
  );
}
