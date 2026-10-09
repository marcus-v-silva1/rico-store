"use client";

import { useSyncExternalStore } from "react";
import type { ColorId } from "@/content/catalog";

export type CartItem = { slug: string; color: ColorId; qty: number };

// Sacola mínima no navegador. Quando o checkout existir, ela passa a vir do banco.
const KEY = "rico-sacola";
const EMPTY: readonly CartItem[] = [];

let items: readonly CartItem[] | null = null;
const listeners = new Set<() => void>();

function load(): readonly CartItem[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CartItem[]) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function snapshot() {
  return (items ??= load());
}

function commit(next: readonly CartItem[]) {
  items = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Armazenamento bloqueado: a sacola vale só nesta aba.
  }
  listeners.forEach((l) => l());
}

export function addToCart(slug: string, color: ColorId) {
  const current = snapshot();
  const found = current.find((i) => i.slug === slug && i.color === color);
  commit(
    found ? current.map((i) => (i === found ? { ...i, qty: i.qty + 1 } : i)) : [...current, { slug, color, qty: 1 }],
  );
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Quantidade total de peças na sacola. Zero no servidor e na primeira renderização. */
export function useCartCount(): number {
  const list = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  return list.reduce((sum, i) => sum + i.qty, 0);
}
