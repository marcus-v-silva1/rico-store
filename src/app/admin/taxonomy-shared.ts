import type { GarmentKind, ProductStatus } from "@/lib/catalog/types";

export const GARMENT_LABEL: Record<GarmentKind, string> = {
  jacket: "Jaqueta",
  hoodie: "Moletom",
  tee: "Camiseta",
  pants: "Calça",
  shorts: "Bermuda",
  cap: "Boné",
  sneaker: "Tênis",
  bag: "Bolsa",
};

export const STATUS_LABEL: Record<ProductStatus, string> = {
  rascunho: "Rascunho",
  ativo: "Ativo",
  arquivado: "Arquivado",
};
