import { cn } from "@/lib/utils";

/** Logotipo: RICO em itálico largo e STORE miúdo, espaçado, logo abaixo. */
export function Logo({ align = "center", className }: { align?: "center" | "start"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex flex-col leading-none",
        align === "center" ? "items-center" : "items-start",
        className,
      )}
    >
      <span className="display text-[1.65rem] tracking-[-0.04em]">Rico</span>
      <span className="label mt-1 text-[0.5rem] tracking-[0.55em] pl-[0.55em]">Store</span>
    </span>
  );
}
