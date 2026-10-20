"use client";

import { createContext, useContext, useMemo } from "react";
import type { CatalogProduct } from "@/lib/catalog/types";
import { catalogIndex, toLines, totalQty, type CartCatalog } from "@/lib/cart";
import { useCartItems } from "./cart";

// O catálogo vem do servidor uma vez, no layout; a sacola só mostra o que ainda está à venda.
const CartCatalogContext = createContext<CartCatalog>(new Map());

export function CartCatalogProvider({
  products,
  children,
}: {
  products: readonly CatalogProduct[];
  children: React.ReactNode;
}) {
  const catalog = useMemo(() => catalogIndex(products), [products]);
  return <CartCatalogContext value={catalog}>{children}</CartCatalogContext>;
}

/** Linhas da sacola com nome, cor e preço atuais. */
export function useCartLines() {
  const items = useCartItems();
  const catalog = useContext(CartCatalogContext);
  return useMemo(() => toLines(items, catalog), [items, catalog]);
}

export const useCartCount = () => totalQty(useCartLines());
