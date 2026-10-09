"use client";

import { setCartOpen, useCartCount } from "./cart";

export function CartButton() {
  const count = useCartCount();
  return (
    <button
      type="button"
      onClick={() => setCartOpen(true)}
      aria-label={`Abrir sacola, ${count} ${count === 1 ? "peça" : "peças"}`}
      className="text-[0.8125rem] font-semibold whitespace-nowrap hover:underline underline-offset-4"
    >
      Sacola ({count})
    </button>
  );
}
