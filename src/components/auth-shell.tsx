import { Logo } from "./brand";
import { PageTransition } from "./page-transition";

/** Moldura das telas de login e cadastro: painel preto da marca + formulário. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <PageTransition>
      <div className="grid min-h-[calc(100dvh-8rem)] lg:grid-cols-[1fr_1fr]">
        <section className="hidden flex-col justify-between bg-ink p-12 text-bone lg:flex" aria-hidden="true">
          <Logo align="start" className="[&>span:first-child]:text-5xl" />
          <p className="display text-6xl">
            Same clothes,
            <span className="outline-text block">different stories.</span>
          </p>
          <p className="label text-bone/60">Belém – PA / Est. 2025</p>
        </section>
        <section className="flex items-center justify-center px-(--gutter) py-14">
          <div className="w-full max-w-sm">
            <h1 className="heading text-3xl">{title}</h1>
            <p className="mt-2 mb-8 text-sm text-ink/70">{subtitle}</p>
            {children}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
