/** Dados da loja. Os valores entre colchetes ainda não foram definidos: troque antes de publicar. */
export const SITE = {
  name: "Rico Store",
  tagline: "Streetwear, casual e trabalho em Belém",
  city: "Belém – PA",
  since: 2025,
  address: "[ENDEREÇO]",
  hours: "[HORÁRIO DE FUNCIONAMENTO]",
  whatsapp: "[NÚMERO]",
  instagram: "[USUÁRIO]",
} as const;

export const BRANDS = [
  "The North Face",
  "Supreme",
  "Nike",
  "Stüssy",
  "Corteiz",
  "Carhartt WIP",
  "Palace",
  "New Balance",
  "Jordan",
] as const;

export const FOOTER_LINKS = {
  Ajuda: ["Trocas e devoluções", "Guia de medidas", "Formas de pagamento", "Fale com a gente"],
} as const;

/** Valores ainda entre colchetes, como "[NÚMERO]", não foram preenchidos. */
export function isPlaceholder(value: string) {
  return value.startsWith("[");
}
