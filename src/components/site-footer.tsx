import { FOOTER_LINKS, SITE } from "@/content/site";
import { getNavCollections, type NavItem } from "@/lib/catalog/queries";
import { Logo } from "./brand";
import { NavLink } from "./nav-link";
import { NewsletterForm } from "./newsletter-form";

const linkClass = "text-[0.8125rem] text-bone hover:underline underline-offset-4";
const colTitle = "mb-4 text-xs text-bone/60";

export async function SiteFooter() {
  // Fora do cache: uma falha do banco vira menu vazio em vez de derrubar todas as páginas.
  let navItems: NavItem[] = [];
  try {
    navItems = await getNavCollections();
  } catch (error) {
    console.error(error);
  }
  return (
    <footer
      className="bg-ink text-bone"
      // Nome próprio na transição: o rodapé desliza até o lugar novo em vez de saltar por cima da página antiga
      style={{ viewTransitionName: "site-footer" }}
    >
      <div className="mx-auto max-w-[88rem] px-(--gutter) pt-16 pb-6">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <Logo align="start" className="[&>span:first-child]:text-[3rem]" />
            <div className="mt-8">
              <NewsletterForm />
            </div>
          </div>

          <nav aria-label="Comprar">
            <h2 className={colTitle}>Comprar</h2>
            <ul className="space-y-3">
              {navItems.map((item) => (
                <li key={item.slug}>
                  <NavLink href={`/colecao/${item.slug}`} className={linkClass}>
                    {item.title}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className={colTitle}>Ajuda</h2>
            <ul className="space-y-3">
              {FOOTER_LINKS.Ajuda.map((label) => (
                <li key={label} className="text-[0.8125rem]">
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className={colTitle}>Loja</h2>
            <ul className="space-y-3 text-[0.8125rem]">
              <li>
                {SITE.address}, {SITE.city}
              </li>
              <li>{SITE.hours}</li>
              <li>WhatsApp {SITE.whatsapp}</li>
              <li>Instagram @{SITE.instagram}</li>
            </ul>
          </div>
        </div>

        <div className="label mt-16 flex flex-wrap justify-between gap-3 border-t border-smoke pt-5 text-[0.625rem] text-bone/70">
          <span>Rico Store / Streetwear / Casual / Trabalho</span>
          <span>
            {SITE.city} / Est. {SITE.since}
          </span>
        </div>
      </div>
    </footer>
  );
}
