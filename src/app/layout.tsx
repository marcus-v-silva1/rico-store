import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono, Reenie_Beanie } from "next/font/google";
import { CartCatalogProvider } from "@/components/cart-catalog";
import { CartDrawer } from "@/components/cart-drawer";
import { SmoothScroll } from "@/components/smooth-scroll";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE } from "@/content/site";
import { getCartCatalog } from "@/lib/catalog/queries";
import type { CatalogProduct } from "@/lib/catalog/types";
import "./globals.css";

// Archivo tem eixo de largura: o mesmo arquivo serve o texto (100) e os títulos largos (125).
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  style: ["normal", "italic"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-label",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const script = Reenie_Beanie({
  variable: "--font-script-hand",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description:
    "As marcas que movem o streetwear, agora em Belém. Moletons, jaquetas, cargo e sneakers com qualidade e autenticidade.",
  applicationName: SITE.name,
};

export const viewport: Viewport = {
  themeColor: "#0f0f0f",
};

/** Se o banco cair, a sacola fica vazia em vez de derrubar o site inteiro. */
async function loadCartCatalog(): Promise<CatalogProduct[]> {
  try {
    return await getCartCatalog();
  } catch (error) {
    console.error("Sacola sem catálogo:", error);
    return [];
  }
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const products = await loadCartCatalog();
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${mono.variable} ${script.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <SmoothScroll>
          <CartCatalogProvider products={products}>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <CartDrawer />
          </CartCatalogProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
