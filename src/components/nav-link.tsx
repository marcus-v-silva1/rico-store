import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * Link com direção. "forward" empurra a página para a esquerda; "back" para a direita
 * (veja `PageTransition` e o CSS em globals.css). O sentido é decisão nossa, não automática.
 */
export function NavLink({
  direction = "forward",
  ...props
}: Omit<ComponentProps<typeof Link>, "transitionTypes"> & { direction?: "forward" | "back" }) {
  return <Link transitionTypes={[direction === "forward" ? "nav-forward" : "nav-back"]} {...props} />;
}
