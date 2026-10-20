import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Fotos dos produtos vêm do bucket público do Supabase.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;

// Categorias saíram de /colecao e ganharam rota própria.
const MOVED_TO_CATEGORY = ["moletons-e-jaquetas", "camisetas", "calcas-e-bermudas"];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: supabaseUrl.protocol === "https:" ? "https" : "http",
            hostname: supabaseUrl.hostname,
            port: supabaseUrl.port,
            pathname: "/storage/v1/object/public/produtos/**",
          },
        ]
      : [],
  },
  async redirects() {
    return MOVED_TO_CATEGORY.map((slug) => ({
      source: `/colecao/${slug}`,
      destination: `/categoria/${slug}`,
      permanent: true,
    }));
  },
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
