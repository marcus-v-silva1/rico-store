import { RowActions, TaxonomyForm, type Kind, type TaxonomyItem } from "./taxonomy-form";

export type ListRow = TaxonomyItem & { active: boolean; note?: string };

/** Lista de itens: tabela no computador, cartões no celular. Cada item abre o próprio formulário de edição. */
export function TaxonomyList({ kind, rows, empty }: { kind: Kind; rows: ListRow[]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-stone">{empty}</p>;
  return (
    <ul className="divide-y divide-ink/15 border-y border-ink/15">
      {rows.map((r, i) => (
        <li key={r.id} className={r.active ? "" : "bg-concrete/60"}>
          <div className="grid items-center gap-3 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_8rem_auto]">
            <div className="flex min-w-0 items-center gap-3">
              {kind === "color" && (
                <span aria-hidden className="size-6 shrink-0 border border-ink/40" style={{ backgroundColor: r.hex }} />
              )}
              <p className="truncate text-sm font-semibold">{r.name}</p>
            </div>
            <p className="truncate font-mono text-xs text-stone">
              {r.slug}
              {r.note ? ` · ${r.note}` : ""}
            </p>
            <p className="label text-[0.625rem]">{r.active ? "Ativo" : "Inativo"}</p>
            <RowActions kind={kind} id={r.id} active={r.active} first={i === 0} last={i === rows.length - 1} />
          </div>
          <details className="pb-3">
            <summary className="label cursor-pointer text-[0.625rem] text-stone hover:text-ink">Editar</summary>
            <div className="mt-4 max-w-3xl">
              <TaxonomyForm kind={kind} item={r} />
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
