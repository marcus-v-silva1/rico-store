"use client";

import { useSyncExternalStore } from "react";
import type { ColorId } from "@/content/catalog";
import { addItem, removeItem, sanitize, setQty, totalQty, type CartItem } from "@/lib/cart";

// Sacola no navegador. Quando o checkout existir, ela passa a vir do banco.
const KEY = "rico-sacola";
const EMPTY: readonly CartItem[] = [];

type State = { items: readonly CartItem[]; open: boolean };
let state: State | null = null;
const listeners = new Set<() => void>();
const SERVER: State = { items: EMPTY, open: false };

function load(): readonly CartItem[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return sanitize(raw ? JSON.parse(raw) : []);
  } catch {
    return EMPTY;
  }
}

function snapshot(): State {
  return (state ??= { items: load(), open: false });
}

function commit(next: State) {
  const persist = next.items !== state?.items;
  state = next;
  if (persist) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next.items));
    } catch {
      // Armazenamento bloqueado: a sacola vale só nesta aba.
    }
  }
  listeners.forEach((l) => l());
}

const edit = (items: readonly CartItem[]) => commit({ ...snapshot(), items });

/** Coloca na sacola e abre a gaveta, para quem comprou ver o resultado na hora. */
export function addToCart(slug: string, color: ColorId) {
  commit({ items: addItem(snapshot().items, slug, color), open: true });
}
export const changeQty = (slug: string, color: ColorId, qty: number) =>
  edit(setQty(snapshot().items, slug, color, qty));
export const removeFromCart = (slug: string, color: ColorId) => edit(removeItem(snapshot().items, slug, color));
export const setCartOpen = (open: boolean) => commit({ ...snapshot(), open });

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Zero/vazio no servidor e na primeira renderização, para a hidratação bater. */
function useCartState() {
  return useSyncExternalStore(subscribe, snapshot, () => SERVER);
}

export const useCartCount = () => totalQty(useCartState().items);
export const useCartItems = () => useCartState().items;
export const useCartOpen = () => useCartState().open;
