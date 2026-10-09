const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Preços ficam em centavos para nunca somar `0.1 + 0.2`. */
export function formatBRL(cents: number): string {
  return brl.format(cents / 100).replace(/ /g, " ");
}
