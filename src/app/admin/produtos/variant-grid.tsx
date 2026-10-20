"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { SIZE_PRESETS, sortSizes } from "@/lib/catalog/sizes";
import { buildSku } from "@/lib/catalog/slug";

export type GridColor = { id: string; slug: string; label: string; hex: string; active: boolean };
export type GridInitial = {
  colorIds: string[];
  sizes: string[];
  stock: Record<string, string>;
  /** Cor principal: a que o card da loja mostra primeiro. */
  defaultColorId: string | null;
};
type CellError = { colorId: string; size: string; message: string };

const PRESETS = [
  { label: "Roupa P–GG", sizes: ["P", "M", "G", "GG"] },
  { label: "Calçado 34–46", sizes: [...SIZE_PRESETS.calcado] },
  { label: "Tamanho único", sizes: [...SIZE_PRESETS.unico] },
];

const cellKey = (colorId: string, size: string) => `${colorId}:${size}`;

/** Grade cor × tamanho. Cada célula é o estoque; vazia = a peça não é vendida nessa cor e tamanho. */
export function VariantGrid({
  colors,
  initial,
  productSlug,
  errors,
  mainColorError,
}: {
  colors: GridColor[];
  initial: GridInitial;
  productSlug: string;
  errors: CellError[];
  mainColorError?: string;
}) {
  const uid = useId();
  const [rows, setRows] = useState(initial.colorIds);
  const [sizes, setSizes] = useState(() => sortSizes(initial.sizes));
  const [stock, setStock] = useState(initial.stock);
  const [picked, setPicked] = useState("");
  const [otherSize, setOtherSize] = useState("");
  const [main, setMain] = useState(initial.defaultColorId ?? "");

  const byId = new Map(colors.map((c) => [c.id, c]));
  const addable = colors.filter((c) => c.active && !rows.includes(c.id));
  const selected = addable.some((c) => c.id === picked) ? picked : (addable[0]?.id ?? "");
  const other = otherSize.trim();
  // Cor principal: só entre as cores com alguma célula preenchida (as que viram variante).
  const mainOptions = rows.filter((id) => sizes.some((s) => (stock[cellKey(id, s)] ?? "").trim() !== ""));
  const mainValue = mainOptions.includes(main) ? main : "";

  function addSizes(more: string[]) {
    setSizes((s) => sortSizes([...s, ...more.map((x) => x.trim()).filter(Boolean)]));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor={`${uid}-color`} className="field-label">
            Cor
          </label>
          <select
            id={`${uid}-color`}
            value={selected}
            onChange={(e) => setPicked(e.target.value)}
            disabled={!addable.length}
            className="field !w-48"
          >
            {addable.length ? (
              addable.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))
            ) : (
              <option value="">Todas as cores já estão na grade</option>
            )}
          </select>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!selected}
          onClick={() => {
            setRows((r) => [...r, selected]);
            setPicked("");
          }}
        >
          Adicionar cor
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {PRESETS.map((p) => (
          <Button key={p.label} type="button" size="sm" variant="outline" onClick={() => addSizes(p.sizes)}>
            {p.label}
          </Button>
        ))}
        <div className="flex items-end gap-2">
          <div>
            <label htmlFor={`${uid}-size`} className="field-label">
              Outro tamanho
            </label>
            <input
              id={`${uid}-size`}
              value={otherSize}
              maxLength={8}
              onChange={(e) => setOtherSize(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                if (other) addSizes([other]);
                setOtherSize("");
              }}
              className="field !w-28"
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!other}
            onClick={() => {
              addSizes([other]);
              setOtherSize("");
            }}
          >
            Adicionar tamanho
          </Button>
        </div>
      </div>

      {rows.length === 0 || sizes.length === 0 ? (
        <p className="text-sm text-stone">
          {rows.length === 0 ? "Adicione uma cor" : "Adicione os tamanhos"} para montar a grade. Célula vazia = a peça
          não é vendida nessa cor e tamanho.
        </p>
      ) : (
        <div className="overflow-x-auto border border-ink/15">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Estoque por cor e tamanho</caption>
            <thead>
              <tr className="border-b border-ink/15">
                <th scope="col" className="label sticky left-0 bg-paper p-3 text-left text-[0.625rem]">
                  Cor
                </th>
                {sizes.map((s) => (
                  <th key={s} scope="col" className="p-2 text-center align-bottom">
                    <span className="block font-semibold">{s}</span>
                    <button
                      type="button"
                      aria-label={`Tirar o tamanho ${s}`}
                      onClick={() => setSizes((all) => all.filter((x) => x !== s))}
                      className="label mt-1 text-[0.5625rem] text-stone hover:text-signal"
                    >
                      Tirar
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((colorId) => {
                const color = byId.get(colorId);
                const label = color?.label ?? "Cor removida";
                return (
                  <tr key={colorId} className="border-b border-ink/10 last:border-b-0">
                    <th scope="row" className="sticky left-0 bg-paper p-3 text-left align-top font-normal">
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="size-4 shrink-0 border border-ink/40"
                          style={{ backgroundColor: color?.hex }}
                        />
                        <span className="font-semibold whitespace-nowrap">{label}</span>
                      </span>
                      {color && !color.active && <span className="block text-xs text-stone">Cor desativada</span>}
                      <button
                        type="button"
                        aria-label={`Tirar a cor ${label}`}
                        onClick={() => setRows((r) => r.filter((x) => x !== colorId))}
                        className="label mt-1 text-[0.5625rem] text-stone hover:text-signal"
                      >
                        Tirar
                      </button>
                    </th>
                    {sizes.map((size) => {
                      const key = cellKey(colorId, size);
                      const value = stock[key] ?? "";
                      const error = errors.find((e) => e.colorId === colorId && e.size === size);
                      const errorId = `${uid}-${key}-error`;
                      return (
                        <td key={size} className="p-2 align-top">
                          <input
                            name={`stock:${key}`}
                            inputMode="numeric"
                            autoComplete="off"
                            aria-label={`Estoque de ${label}, tamanho ${size}`}
                            aria-invalid={error ? true : undefined}
                            aria-describedby={error ? errorId : undefined}
                            value={value}
                            onChange={(e) => setStock((all) => ({ ...all, [key]: e.target.value }))}
                            className="field !w-20 text-center aria-[invalid=true]:!border-signal"
                          />
                          {value.trim() !== "" && color && (
                            <span className="mt-1 block max-w-28 truncate font-mono text-[0.5625rem] text-stone">
                              {buildSku(productSlug, color.slug, size)}
                            </span>
                          )}
                          {error && (
                            <span
                              id={errorId}
                              className="mt-1 block max-w-28 text-[0.6875rem] font-semibold text-signal"
                            >
                              {error.message}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <label htmlFor={`${uid}-main`} className="field-label">
          Cor principal (a que aparece primeiro na loja)
        </label>
        <select
          id={`${uid}-main`}
          name="defaultColorId"
          value={mainValue}
          onChange={(e) => setMain(e.target.value)}
          aria-invalid={mainColorError ? true : undefined}
          aria-describedby={mainColorError ? `${uid}-main-error` : undefined}
          className="field !w-64 aria-[invalid=true]:!border-signal"
        >
          <option value="">{mainOptions.length ? "A primeira da lista de cores" : "Preencha a grade primeiro"}</option>
          {mainOptions.map((id) => (
            <option key={id} value={id}>
              {byId.get(id)?.label ?? "Cor removida"}
            </option>
          ))}
        </select>
        {mainColorError && (
          <p id={`${uid}-main-error`} className="mt-1 text-xs font-semibold text-signal">
            {mainColorError}
          </p>
        )}
      </div>
    </div>
  );
}
