"use client";

import Image from "next/image";
import { startTransition, useId, useOptimistic, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { checkImageFile, imagePath } from "@/lib/catalog/images";
import { isLoopbackUrl } from "@/lib/image-host";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { GridColor } from "../variant-grid";
import { addProductImage, removeProductImage, reorderProductImages, updateProductImage } from "./photo-actions";

export type AdminPhoto = { id: string; url: string; colorId: string | null; alt: string };

const BUCKET = "produtos";
const ACCEPT = "image/jpeg,image/png,image/webp";

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Bloco Fotos do produto já salvo: envio direto ao bucket, ordem, cor e texto alternativo. */
export function Photos({
  productId,
  productName,
  photos,
  colors,
}: {
  productId: string;
  productName: string;
  photos: AdminPhoto[];
  colors: GridColor[];
}) {
  const uid = useId();
  const input = useRef<HTMLInputElement>(null);
  const [supabase] = useState(createClient);
  const [uploading, setUploading] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ text: string; error: boolean }[]>([]);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [ordered, setOrdered] = useOptimistic(photos);

  async function upload(files: File[]) {
    const problems: { text: string; error: boolean }[] = [];
    const fail = (file: File, text: string) => problems.push({ text: `${file.name}: ${text}`, error: true });
    let sent = 0;
    for (const [i, file] of files.entries()) {
      const problem = checkImageFile(file);
      if (problem) {
        fail(file, problem);
        continue;
      }
      setUploading(`Enviando ${i + 1} de ${files.length}…`);
      const path = imagePath(productId, file.type, crypto.randomUUID());
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
      if (error) {
        console.error("Photos: falha ao enviar", file.name, error);
        fail(file, "Não foi possível enviar. Tente de novo.");
        continue;
      }
      const result = await addProductImage(productId, path, null, "");
      if (result.error) {
        // Sem a linha, o arquivo ficaria solto no bucket.
        const { error: cleanup } = await supabase.storage.from(BUCKET).remove([path]);
        if (cleanup) console.error("Photos: arquivo enviado ficou sem registro", path, cleanup);
        fail(file, result.error);
        continue;
      }
      sent++;
    }
    setUploading(null);
    const ok = { text: sent === 1 ? "1 foto enviada." : `${sent} fotos enviadas.`, error: false };
    setMessages(sent ? [...problems, ok] : problems);
    if (input.current) input.current.value = "";
  }

  function reorder(from: number, to: number) {
    if (to < 0 || to >= ordered.length || from === to) return;
    const next = move(ordered, from, to);
    setOrderError(null);
    startTransition(async () => {
      setOrdered(next);
      const result = await reorderProductImages(
        productId,
        next.map((p) => p.id),
      );
      if (result.error) setOrderError(result.error);
    });
  }

  return (
    <section aria-labelledby={`${uid}-fotos`}>
      <h2 id={`${uid}-fotos`} className="heading mb-1 text-xl">
        Fotos
      </h2>
      <p className="mb-4 text-sm text-stone">
        JPEG, PNG ou WebP até 5 MB, de preferência em pé (4:5). A primeira foto aparece na vitrine. Arraste ou use as
        setas para mudar a ordem.
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          ref={input}
          id={`${uid}-arquivos`}
          type="file"
          multiple
          accept={ACCEPT}
          aria-label="Escolher fotos para enviar"
          tabIndex={-1}
          className="sr-only"
          disabled={uploading !== null}
          onChange={(e) => {
            const files = Array.from(e.currentTarget.files ?? []);
            if (files.length) void upload(files);
          }}
        />
        <Button type="button" variant="outline" disabled={uploading !== null} onClick={() => input.current?.click()}>
          {uploading ?? "Enviar fotos"}
        </Button>
      </div>

      {messages.length > 0 && (
        <ul role="status" className="mb-6 space-y-1 text-xs">
          {messages.map((m, i) => (
            <li key={i} className={m.error ? "font-semibold text-signal" : "text-olive"}>
              {m.text}
            </li>
          ))}
        </ul>
      )}
      {orderError && (
        <p role="alert" className="mb-6 text-xs font-semibold text-signal">
          {orderError}
        </p>
      )}

      {ordered.length === 0 ? (
        <p className="text-sm text-stone">Nenhuma foto ainda.</p>
      ) : (
        <ol className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {ordered.map((photo, index) => (
            <li
              key={photo.id}
              draggable
              onDragStart={(e) => {
                setDragging(photo.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => setDragging(null)}
              onDragOver={(e) => {
                if (dragging) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                const from = ordered.findIndex((p) => p.id === dragging);
                setDragging(null);
                if (from >= 0) reorder(from, index);
              }}
              className={cn(dragging === photo.id && "opacity-40")}
            >
              <PhotoItem
                photo={photo}
                index={index}
                total={ordered.length}
                productName={productName}
                colors={colors}
                onMove={(to) => reorder(index, to)}
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function PhotoItem({
  photo,
  index,
  total,
  productName,
  colors,
  onMove,
}: {
  photo: AdminPhoto;
  index: number;
  total: number;
  productName: string;
  colors: GridColor[];
  onMove: (to: number) => void;
}) {
  const uid = useId();
  const [colorId, setColorId] = useState(photo.colorId);
  const [alt, setAlt] = useState(photo.alt);
  const [saved, setSaved] = useState({ colorId: photo.colorId, alt: photo.alt });
  const [status, setStatus] = useState<{ ok?: boolean; error?: string }>({});
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const options = colors.filter((c) => c.active || c.id === colorId);
  const position = `Foto ${index + 1} de ${total}`;

  function save(next: { colorId: string | null; alt: string }) {
    if (next.colorId === saved.colorId && next.alt.trim() === saved.alt) return;
    start(async () => {
      const result = await updateProductImage(photo.id, next.colorId, next.alt);
      if (result.error) setStatus({ error: result.error });
      else {
        setSaved({ colorId: next.colorId, alt: next.alt.trim() });
        setStatus({ ok: true });
      }
    });
  }

  function remove() {
    start(async () => {
      const result = await removeProductImage(photo.id);
      if (result.error) {
        setStatus({ error: result.error });
        setConfirming(false);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] cursor-grab bg-concrete">
        <Image
          src={photo.url}
          alt={alt || `${productName}, ${position.toLowerCase()}`}
          fill
          sizes="(min-width: 64rem) 20vw, (min-width: 40rem) 30vw, 45vw"
          unoptimized={isLoopbackUrl(photo.url)}
          className="object-cover"
        />
        {index === 0 && (
          <span className="label absolute top-2 left-2 bg-ink px-2 py-1 text-[0.625rem] tracking-normal text-bone normal-case">
            Capa
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={index === 0}
          onClick={() => onMove(index - 1)}
          aria-label={`Mover para a esquerda (${position})`}
        >
          ←
        </Button>
        <span className="text-xs text-stone">{index + 1}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={index === total - 1}
          onClick={() => onMove(index + 1)}
          aria-label={`Mover para a direita (${position})`}
        >
          →
        </Button>
      </div>

      <div>
        <label htmlFor={`${uid}-cor`} className="field-label">
          Cor
        </label>
        <select
          id={`${uid}-cor`}
          value={colorId ?? ""}
          onChange={(e) => {
            const next = e.target.value || null;
            setColorId(next);
            save({ colorId: next, alt });
          }}
          className="field"
        >
          <option value="">Todas as cores</option>
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
              {c.active ? "" : " (desativada)"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${uid}-alt`} className="field-label">
          Texto alternativo
        </label>
        <input
          id={`${uid}-alt`}
          value={alt}
          maxLength={200}
          placeholder="Ex.: modelo de frente vestindo a regata preta"
          onChange={(e) => setAlt(e.target.value)}
          onBlur={() => save({ colorId, alt })}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save({ colorId, alt });
            }
          }}
          className="field"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {confirming ? (
          <>
            <Button type="button" size="sm" disabled={pending} onClick={remove}>
              {pending ? "Removendo…" : "Confirmar remoção"}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
          </>
        ) : (
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => setConfirming(true)}>
            Remover
          </Button>
        )}
        {pending && !confirming && <span className="text-xs text-stone">Salvando…</span>}
        {!pending && status.ok && (
          <span role="status" className="text-xs text-olive">
            Salvo
          </span>
        )}
        {!pending && status.error && (
          <span role="alert" className="text-xs font-semibold text-signal">
            {status.error}
          </span>
        )}
      </div>
    </div>
  );
}
