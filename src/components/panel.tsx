import { Suspense } from "react";
import { PageTransition } from "./page-transition";

/** Casca das áreas com login: título e uma cortina enquanto o servidor confere quem entrou. */
export function Panel({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <PageTransition>
      <div className="mx-auto max-w-[88rem] px-(--gutter) py-12">
        <p className="label text-stone">{kicker}</p>
        <h1 className="display mt-3 text-[clamp(2.25rem,6vw,4.25rem)]">{title}</h1>
        <div className="mt-10">
          <Suspense fallback={<p className="label text-stone">Carregando…</p>}>{children}</Suspense>
        </div>
      </div>
    </PageTransition>
  );
}

export function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-concrete p-5">
      <p className="label text-[0.625rem] text-stone">{label}</p>
      <p className="heading mt-2 text-4xl">{value}</p>
    </div>
  );
}
