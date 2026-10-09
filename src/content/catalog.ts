export type Line = "street" | "casual" | "trabalho";
export type CategoryId = "moletons-e-jaquetas" | "camisetas" | "calcas-e-bermudas" | "sneakers" | "acessorios";

export type GarmentKind = "jacket" | "hoodie" | "tee" | "pants" | "shorts" | "cap" | "sneaker" | "bag";

export const COLORS = {
  preto: { label: "Preto", hex: "#121212" },
  branco: { label: "Branco", hex: "#f6f5f1" },
  cinza: { label: "Cinza", hex: "#9a9a95" },
  oliva: { label: "Oliva", hex: "#5b6240" },
  vinho: { label: "Vinho", hex: "#7a1f24" },
  azul: { label: "Azul", hex: "#46608f" },
} as const;
export type ColorId = keyof typeof COLORS;

export type Product = {
  slug: string;
  name: string;
  /** Texto curto sob o nome: "Preto", "Cinza mescla"… */
  detail: string;
  line: Line;
  category: CategoryId;
  garment: GarmentKind;
  /** A primeira cor é a exibida por padrão. */
  colors: readonly ColorId[];
  /** Em centavos. Valores de exemplo: o preço real vem do cadastro da loja. */
  priceCents: number;
  isNew: boolean;
};

export const PRODUCTS: readonly Product[] = [
  {
    slug: "jaqueta-puffer",
    name: "Jaqueta puffer",
    detail: "Preto",
    line: "street",
    category: "moletons-e-jaquetas",
    garment: "jacket",
    colors: ["preto", "oliva", "cinza"],
    priceCents: 52990,
    isNew: true,
  },
  {
    slug: "moletom-com-capuz",
    name: "Moletom com capuz",
    detail: "Cinza mescla",
    line: "street",
    category: "moletons-e-jaquetas",
    garment: "hoodie",
    colors: ["cinza", "preto", "vinho"],
    priceCents: 32990,
    isNew: false,
  },
  {
    slug: "camiseta-oversized",
    name: "Camiseta oversized",
    detail: "Branco",
    line: "casual",
    category: "camisetas",
    garment: "tee",
    colors: ["branco", "preto"],
    priceCents: 12990,
    isNew: true,
  },
  {
    slug: "calca-cargo-baggy",
    name: "Calça cargo baggy",
    detail: "Oliva",
    line: "street",
    category: "calcas-e-bermudas",
    garment: "pants",
    colors: ["oliva", "preto"],
    priceCents: 27990,
    isNew: true,
  },
  {
    slug: "corta-vento",
    name: "Corta-vento",
    detail: "Preto e cinza",
    line: "street",
    category: "moletons-e-jaquetas",
    garment: "jacket",
    colors: ["preto", "cinza"],
    priceCents: 29990,
    isNew: false,
  },
  {
    slug: "bermuda-de-nylon",
    name: "Bermuda de nylon",
    detail: "Preto",
    line: "casual",
    category: "calcas-e-bermudas",
    garment: "shorts",
    colors: ["preto", "azul"],
    priceCents: 17990,
    isNew: false,
  },
  {
    slug: "bone-aba-curva",
    name: "Boné aba curva",
    detail: "Preto",
    line: "casual",
    category: "acessorios",
    garment: "cap",
    colors: ["preto", "branco"],
    priceCents: 9990,
    isNew: false,
  },
  {
    slug: "tenis-cano-baixo",
    name: "Tênis cano baixo",
    detail: "Branco e preto",
    line: "street",
    category: "sneakers",
    garment: "sneaker",
    colors: ["branco", "preto"],
    priceCents: 49990,
    isNew: false,
  },
  {
    slug: "jaqueta-workwear",
    name: "Jaqueta workwear",
    detail: "Preto",
    line: "trabalho",
    category: "moletons-e-jaquetas",
    garment: "jacket",
    colors: ["preto", "oliva"],
    priceCents: 34990,
    isNew: true,
  },
  {
    slug: "calca-dupla-costura",
    name: "Calça dupla costura",
    detail: "Preto",
    line: "trabalho",
    category: "calcas-e-bermudas",
    garment: "pants",
    colors: ["preto", "oliva", "cinza"],
    priceCents: 25990,
    isNew: false,
  },
  {
    slug: "camiseta-pesada",
    name: "Camiseta pesada",
    detail: "Cinza",
    line: "trabalho",
    category: "camisetas",
    garment: "tee",
    colors: ["cinza", "preto", "branco"],
    priceCents: 11990,
    isNew: false,
  },
  {
    slug: "bolsa-transversal",
    name: "Bolsa transversal",
    detail: "Preto",
    line: "street",
    category: "acessorios",
    garment: "bag",
    colors: ["preto"],
    priceCents: 15990,
    isNew: false,
  },
];

export type Collection = {
  slug: string;
  title: string;
  kicker: string;
  description: string;
  match: (p: Product) => boolean;
};

/** Páginas /colecao/[slug]: as três linhas da loja e as categorias. */
export const COLLECTIONS: readonly Collection[] = [
  {
    slug: "street",
    title: "Street",
    kicker: "Streetwear / original vibe",
    description: "Moletons, jaquetas, cargo e sneakers das marcas que movem o streetwear.",
    match: (p) => p.line === "street",
  },
  {
    slug: "casual",
    title: "Casual",
    kicker: "Dia a dia / sempre atual",
    description: "Peças simples e bem cortadas para usar de segunda a domingo.",
    match: (p) => p.line === "casual",
  },
  {
    slug: "trabalho",
    title: "Trabalho",
    kicker: "Workwear / resistência",
    description: "Roupa de trabalho com acabamento firme e cara de rua.",
    match: (p) => p.line === "trabalho",
  },
  {
    slug: "sneakers",
    title: "Sneakers",
    kicker: "Nike / New Balance / Jordan",
    description: "Tênis para completar o look, dos clássicos aos lançamentos.",
    match: (p) => p.category === "sneakers",
  },
  {
    slug: "acessorios",
    title: "Acessórios",
    kicker: "Bonés / bolsas / detalhes",
    description: "O detalhe que fecha o visual.",
    match: (p) => p.category === "acessorios",
  },
  {
    slug: "moletons-e-jaquetas",
    title: "Moletons e jaquetas",
    kicker: "Conforto / estilo / proteção",
    description: "Camadas para o dia inteiro.",
    match: (p) => p.category === "moletons-e-jaquetas",
  },
  {
    slug: "camisetas",
    title: "Camisetas",
    kicker: "Básicas / oversized / estampas",
    description: "A base de todo look.",
    match: (p) => p.category === "camisetas",
  },
  {
    slug: "calcas-e-bermudas",
    title: "Calças e bermudas",
    kicker: "Cargo / baggy / street",
    description: "Modelagens largas e bolsos de verdade.",
    match: (p) => p.category === "calcas-e-bermudas",
  },
];

/** Itens do menu principal, na ordem do layout. */
export const NAV_SLUGS = ["street", "casual", "trabalho", "sneakers", "acessorios"] as const;

/** Os quatro cartões de "Comprar por categoria". */
export const HOME_CATEGORIES = [
  { slug: "moletons-e-jaquetas", garment: "jacket" },
  { slug: "camisetas", garment: "tee" },
  { slug: "calcas-e-bermudas", garment: "pants" },
  { slug: "sneakers", garment: "sneaker" },
] as const satisfies readonly { slug: string; garment: GarmentKind }[];

export function getCollection(slug: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

export function productsIn(collection: Collection): Product[] {
  return PRODUCTS.filter(collection.match);
}
