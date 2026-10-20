"use client";

import { useActionState, useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/catalog/slug";
import { GARMENT_KINDS, type GarmentKind } from "@/lib/catalog/types";
import { GARMENT_LABEL } from "./taxonomy-shared";
import { moveCategory, saveCategory, setCategoryActive } from "./categorias/actions";
import { moveCollection, saveCollection, setCollectionActive } from "./colecoes/actions";
import { moveColor, saveColor, setColorActive } from "./cores/actions";
import type { FormState } from "./taxonomy-server";

export type Kind = "category" | "collection" | "color";

/** Valores já salvos de um item, no formato do formulário. */
export type TaxonomyItem = {
  id: string;
  name: string; // nome, título ou rótulo, conforme o tipo
  slug: string;
  kicker?: string;
  description?: string;
  garment?: GarmentKind;
  flag?: boolean; // "aparece na home" (categoria) ou "aparece no menu" (coleção)
  hex?: string;
};

const SAVE = { category: saveCategory, collection: saveCollection, color: saveColor } as const;
const MOVE = { category: moveCategory, collection: moveCollection, color: moveColor } as const;
const ACTIVE = { category: setCategoryActive, collection: setCollectionActive, color: setColorActive } as const;

const NAME_FIELD = { category: "name", collection: "title", color: "label" } as const;
const NAME_LABEL = { category: "Nome", collection: "Título", color: "Nome" } as const;
const FLAG_LABEL = { category: "Aparece na home", collection: "Aparece no menu", color: "" } as const;
const FLAG_FIELD = { category: "showOnHome", collection: "showInNav", color: "" } as const;
const SUBMIT = {
  category: ["Criar categoria", "Salvar categoria"],
  collection: ["Criar coleção", "Salvar coleção"],
  color: ["Criar cor", "Salvar cor"],
} as const;

const HEX_OK = /^#[0-9a-fA-F]{6}$/;

export function TaxonomyForm({ kind, item }: { kind: Kind; item?: TaxonomyItem }) {
  const uid = useId();
  const editing = Boolean(item);
  const [name, setName] = useState(item?.name ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(editing);
  const [hex, setHex] = useState(item?.hex ?? "#000000");

  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await SAVE[kind](prev, formData);
    if (result.ok && !editing) {
      setName("");
      setSlug("");
      setSlugTouched(false);
      setHex("#000000");
    }
    return result;
  }, {});

  const flagField = FLAG_FIELD[kind];

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {item && <input type="hidden" name="id" value={item.id} />}
      <div>
        <label htmlFor={`${uid}-name`} className="field-label">
          {NAME_LABEL[kind]}
        </label>
        <input
          id={`${uid}-name`}
          name={NAME_FIELD[kind]}
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          className="field"
        />
      </div>
      <div>
        <label htmlFor={`${uid}-slug`} className="field-label">
          Endereço
        </label>
        <input
          id={`${uid}-slug`}
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          className="field"
        />
      </div>

      {kind === "color" && (
        <div className="sm:col-span-2">
          <label htmlFor={`${uid}-hex`} className="field-label">
            Cor
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              aria-label="Escolher a cor"
              value={HEX_OK.test(hex) ? hex.toLowerCase() : "#000000"}
              onChange={(e) => setHex(e.target.value)}
              className="h-11 w-14 cursor-pointer border border-ink bg-transparent p-1"
            />
            <input
              id={`${uid}-hex`}
              name="hex"
              required
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              placeholder="#2a2a2a"
              className="field !w-40 font-mono"
            />
          </div>
        </div>
      )}

      {kind !== "color" && (
        <>
          <div>
            <label htmlFor={`${uid}-kicker`} className="field-label">
              Chamada (texto curto)
            </label>
            <input id={`${uid}-kicker`} name="kicker" defaultValue={item?.kicker ?? ""} className="field" />
          </div>
          {kind === "category" ? (
            <div>
              <label htmlFor={`${uid}-garment`} className="field-label">
                Desenho
              </label>
              <select id={`${uid}-garment`} name="garment" defaultValue={item?.garment ?? "tee"} className="field">
                {GARMENT_KINDS.map((g) => (
                  <option key={g} value={g}>
                    {GARMENT_LABEL[g]}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div />
          )}
          <div className="sm:col-span-2">
            <label htmlFor={`${uid}-desc`} className="field-label">
              Descrição
            </label>
            <textarea
              id={`${uid}-desc`}
              name="description"
              rows={2}
              defaultValue={item?.description ?? ""}
              className="field"
            />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              name={flagField}
              defaultChecked={item?.flag ?? false}
              className="size-4 accent-ink"
            />
            {FLAG_LABEL[kind]}
          </label>
        </>
      )}

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : SUBMIT[kind][editing ? 1 : 0]}
        </Button>
        {state.ok && (
          <span role="status" className="text-xs text-olive">
            Salvo
          </span>
        )}
        {state.error && (
          <span role="alert" className="text-xs font-semibold text-signal">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}

/** Subir, descer e ativar/desativar um item da lista. */
export function RowActions({
  kind,
  id,
  active,
  first,
  last,
}: {
  kind: Kind;
  id: string;
  active: boolean;
  first: boolean;
  last: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();

  function run(task: () => Promise<FormState>) {
    setError(undefined);
    start(async () => {
      const result = await task();
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-label="Subir"
        disabled={pending || first}
        onClick={() => run(() => MOVE[kind](id, "up"))}
      >
        ↑
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-label="Descer"
        disabled={pending || last}
        onClick={() => run(() => MOVE[kind](id, "down"))}
      >
        ↓
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run(() => ACTIVE[kind](id, !active))}
      >
        {active ? "Desativar" : "Ativar"}
      </Button>
      {error && (
        <span role="alert" className="text-xs font-semibold text-signal">
          {error}
        </span>
      )}
    </div>
  );
}
