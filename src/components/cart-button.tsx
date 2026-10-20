"use client";

import { setCartOpen } from "./cart";
import { useCartCount } from "./cart-catalog";

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
