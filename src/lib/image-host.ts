const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]"]);

/**
 * O Next 16 não otimiza imagens de IP local (`images.dangerouslyAllowLocalIP`).
 * Fotos do Supabase local (127.0.0.1:54321) vão direto, sem otimização.
 */
export function isLoopbackUrl(src: string): boolean {
  if (!/^https?:\/\//i.test(src)) return false;
  try {
    return LOOPBACK.has(new URL(src).hostname);
  } catch {
    return false;
  }
}
