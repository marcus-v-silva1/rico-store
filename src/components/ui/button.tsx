import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { NavLink } from "@/components/nav-link";
import type { ComponentProps } from "react";

export const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 border font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        /** Claro sobre fundo preto (ação principal do hero). */
        light: "border-bone bg-bone text-ink hover:bg-white focus-visible:outline-bone",
        /** Contorno claro sobre fundo preto. */
        ghost: "border-bone/70 bg-transparent text-bone hover:border-bone hover:bg-bone/10 focus-visible:outline-bone",
        /** Preto sólido sobre fundo claro. */
        dark: "border-ink bg-ink text-bone hover:bg-graphite focus-visible:outline-ink",
        /** Contorno preto sobre fundo claro. */
        outline:
          "border-ink/80 bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-bone focus-visible:outline-ink",
      },
      size: {
        sm: "h-9 px-3.5 text-xs",
        md: "h-11 px-5 text-[0.8125rem]",
      },
    },
    defaultVariants: { variant: "dark", size: "md" },
  },
);

type Style = VariantProps<typeof buttonStyles>;

export function Button({ variant, size, className, ...props }: ComponentProps<"button"> & Style) {
  return <button className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}

/** Link com cara de botão. Sem `asChild`: o elemento já é um link. */
export function LinkButton({ variant, size, className, ...props }: ComponentProps<typeof NavLink> & Style) {
  return <NavLink className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}
