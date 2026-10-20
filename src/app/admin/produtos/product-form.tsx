"use client";

import { startTransition, useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/catalog/slug";
import { GARMENT_KINDS, PRODUCT_STATUSES, type GarmentKind, type ProductStatus } from "@/lib/catalog/types";
import { GARMENT_LABEL, STATUS_LABEL } from "../taxonomy-shared";
import { saveProduct, type ProductFormState } from "./actions";
import { VariantGrid, type GridColor, type GridInitial } from "./variant-grid";

export type ProductValues = {
  id: string;
  name: string;
  slug: string;
  detail: string;
  description: string;
  categoryId: string;
  priceCents: number;
  weightGrams: number;
  isNew: boolean;
  garment: GarmentKind;
  status: ProductStatus;
  collectionIds: string[];
};

export type CategoryOption = { id: string; name: string; garment: GarmentKind; active: boolean };
export type CollectionOption = { id: string; title: string; active: boolean };

function centsToText(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function ProductForm({
  product,
  categories,
  collections,
  colors,
  grid,
}: {
  product?: ProductValues;
  categories: CategoryOption[];
  collections: CollectionOption[];
  colors: GridColor[];
  grid: GridInitial;
}) {
  const uid = useId();
  const editing = Boolean(product);
  const firstCategory = categories.find((c) => c.active);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(editing);
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? firstCategory?.id ?? "");
  const [garment, setGarment] = useState<GarmentKind>(product?.garment ?? firstCategory?.garment ?? "tee");
  const [garmentTouched, setGarmentTouched] = useState(editing);
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProduct, {});

  const fe = state.fieldErrors ?? {};
  const field = (key: string) => ({
    id: `${uid}-${key}`,
    name: key,
    "aria-invalid": fe[key] ? true : undefined,
    "aria-describedby": fe[key] ? `${uid}-${key}-error` : undefined,
  });
  const fieldError = (key: string) =>
    fe[key] ? (
      <p id={`${uid}-${key}-error`} className="mt-1 text-xs font-semibold text-signal">
        {fe[key]}
      </p>
    ) : null;
  const invalid = "aria-[invalid=true]:!border-signal";

  return (
    <form
      noValidate
      // Sem o reset automático do React: se der erro, o que foi digitado continua na tela.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className="space-y-12"
    >
      {product && <input type="hidden" name="id" value={product.id} />}

      <section aria-labelledby={`${uid}-dados`} className="max-w-3xl">
        <h2 id={`${uid}-dados`} className="heading mb-4 text-xl">
          Dados
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${uid}-name`} className="field-label">
              Nome
            </label>
            <input
              {...field("name")}
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              className={`field ${invalid}`}
            />
            {fieldError("name")}
          </div>
          <div>
            <label htmlFor={`${uid}-slug`} className="field-label">
              Endereço
            </label>
            <input
              {...field("slug")}
              required
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              className={`field font-mono ${invalid}`}
            />
            {fieldError("slug")}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor={`${uid}-detail`} className="field-label">
              Detalhe (texto curto sob o nome)
            </label>
            <input
              {...field("detail")}
              defaultValue={product?.detail ?? ""}
              maxLength={60}
              className={`field ${invalid}`}
            />
            {fieldError("detail")}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor={`${uid}-description`} className="field-label">
              Descrição
            </label>
            <textarea
              {...field("description")}
              rows={4}
              defaultValue={product?.description ?? ""}
              maxLength={2000}
              className={`field ${invalid}`}
            />
            {fieldError("description")}
          </div>
          <div>
            <label htmlFor={`${uid}-price`} className="field-label">
              Preço (R$)
            </label>
            <input
              {...field("price")}
              inputMode="decimal"
              placeholder="129,90"
              defaultValue={product ? centsToText(product.priceCents) : ""}
              className={`field ${invalid}`}
            />
            {fieldError("price")}
          </div>
          <div>
            <label htmlFor={`${uid}-weightGrams`} className="field-label">
              Peso (gramas)
            </label>
            <input
              {...field("weightGrams")}
              inputMode="numeric"
              defaultValue={String(product?.weightGrams ?? 300)}
              className={`field ${invalid}`}
            />
            {fieldError("weightGrams")}
          </div>
          <div>
            <label htmlFor={`${uid}-categoryId`} className="field-label">
              Categoria
            </label>
            <select
              {...field("categoryId")}
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                const picked = categories.find((c) => c.id === e.target.value);
                if (picked && !garmentTouched) setGarment(picked.garment);
              }}
              className={`field ${invalid}`}
            >
              {!categoryId && <option value="">Escolha</option>}
              {categories
                .filter((c) => c.active || c.id === categoryId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.active ? "" : " (desativada)"}
                  </option>
                ))}
            </select>
            {fieldError("categoryId")}
          </div>
          <div>
            <label htmlFor={`${uid}-garment`} className="field-label">
              Desenho (quando não há foto)
            </label>
            <select
              {...field("garment")}
              value={garment}
              onChange={(e) => {
                setGarment(e.target.value as GarmentKind);
                setGarmentTouched(true);
              }}
              className={`field ${invalid}`}
            >
              {GARMENT_KINDS.map((g) => (
                <option key={g} value={g}>
                  {GARMENT_LABEL[g]}
                </option>
              ))}
            </select>
            {fieldError("garment")}
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="field-label">Coleções</legend>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {collections
                .filter((c) => c.active || product?.collectionIds.includes(c.id))
                .map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="collectionIds"
                      value={c.id}
                      defaultChecked={product?.collectionIds.includes(c.id) ?? false}
                      className="size-4 accent-ink"
                    />
                    {c.title}
                    {c.active ? "" : " (desativada)"}
                  </label>
                ))}
              {collections.length === 0 && <p className="text-sm text-stone">Nenhuma coleção cadastrada.</p>}
            </div>
            {fieldError("collectionIds")}
          </fieldset>
          <div>
            <label htmlFor={`${uid}-status`} className="field-label">
              Situação
            </label>
            <select {...field("status")} defaultValue={product?.status ?? "rascunho"} className={`field ${invalid}`}>
              {PRODUCT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            {fieldError("status")}
          </div>
          <label className="flex items-center gap-2 self-end pb-3 text-sm">
            <input
              type="checkbox"
              name="isNew"
              defaultChecked={product?.isNew ?? false}
              className="size-4 accent-ink"
            />
            Marcar como novidade
          </label>
        </div>
      </section>

      <section aria-labelledby={`${uid}-variantes`}>
        <h2 id={`${uid}-variantes`} className="heading mb-1 text-xl">
          Variantes
        </h2>
        <p className="mb-4 text-sm text-stone">Digite o estoque de cada cor e tamanho. 0 = sem estoque agora.</p>
        <VariantGrid colors={colors} initial={grid} productSlug={slug} errors={state.cellErrors ?? []} />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : editing ? "Salvar produto" : "Criar produto"}
        </Button>
        {state.ok && !pending && (
          <span role="status" className="text-xs text-olive">
            Salvo
          </span>
        )}
        {state.error && !pending && (
          <span role="alert" className="text-xs font-semibold text-signal">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
