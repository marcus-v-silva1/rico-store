import { Suspense } from "react";
import { getViewer } from "@/lib/auth";
import { getNavCollections } from "@/lib/catalog/queries";
import { homeFor } from "@/lib/roles";
import { Logo } from "./brand";
import { CartCount } from "./cart-count";
import { MainNav, MainNavFallback } from "./main-nav";
import { NavLink } from "./nav-link";

const accountClass = "text-[0.8125rem] text-bone/80 hover:text-bone";

async function AccountLink() {
  const viewer = await getViewer();
  return viewer ? (
    <NavLink href={homeFor(viewer.role)} className={accountClass}>
      Minha conta
    </NavLink>
  ) : (
    <NavLink href="/login" className={accountClass}>
      Entrar
    </NavLink>
  );
}

// O menu vem do banco em cache: entra no shell estático.
export async function SiteHeader() {
  const navItems = await getNavCollections();
  const navFallback = <MainNavFallback items={navItems} />;
  return (
    // viewTransitionName ancora o cabeçalho: só o conteúdo desliza entre páginas.
    <header className="sticky top-0 z-40 bg-ink text-bone" style={{ viewTransitionName: "site-header" }}>
      <div className="mx-auto grid max-w-[88rem] grid-cols-[1fr_auto] items-center gap-x-4 px-(--gutter) py-3 lg:grid-cols-[1fr_auto_1fr] lg:py-0">
        <div className="hidden lg:block">
          <Suspense fallback={navFallback}>
            <MainNav items={navItems} />
          </Suspense>
        </div>

        <NavLink
          href="/"
          direction="back"
          aria-label="Rico Store, página inicial"
          className="justify-self-start lg:h-14 lg:justify-self-center lg:py-2"
        >
          <Logo />
        </NavLink>

        <div className="flex items-center justify-end gap-5">
          <Suspense fallback={<span className={accountClass}>Entrar</span>}>
            <AccountLink />
          </Suspense>
          <span className="text-[0.8125rem] font-semibold whitespace-nowrap">
            Sacola (<CartCount />)
          </span>
        </div>
      </div>

      {/* No celular o menu vira uma faixa que se arrasta na horizontal */}
      <div className="border-t border-smoke lg:hidden">
        <div className="overflow-x-auto px-(--gutter) py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Suspense fallback={navFallback}>
            <MainNav items={navItems} />
          </Suspense>
        </div>
      </div>
      <div className="border-b border-smoke" aria-hidden="true" />
    </header>
  );
}
