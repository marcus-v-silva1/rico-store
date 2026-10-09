import { ViewTransition } from "react";

const slide = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" } as const;

/**
 * Envolva o conteúdo de cada `page.tsx` (não o layout, que não remonta ao navegar).
 * Navegações marcadas por `NavLink` deslizam na horizontal; as demais não animam.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={slide} exit={slide} default="none">
      {children}
    </ViewTransition>
  );
}
