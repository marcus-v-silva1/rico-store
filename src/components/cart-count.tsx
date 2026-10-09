"use client";

import { useCartCount } from "./cart";

export function CartCount() {
  return <>{useCartCount()}</>;
}
