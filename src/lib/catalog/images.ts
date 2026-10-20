export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export function checkImageFile(f: { type: string; size: number }): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(f.type)) {
    return "Envie uma foto em JPEG, PNG ou WebP.";
  }
  if (f.size > IMAGE_MAX_BYTES) return "A foto passa de 5 MB. Diminua e envie de novo.";
  return null;
}

/** Caminho no bucket: `${productId}/${id}.${ext}`. */
export function imagePath(productId: string, fileName: string, id: string): string {
  const ext = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "";
  return `${productId}/${id}.${/^[a-z0-9]{1,5}$/.test(ext) ? ext : "jpg"}`;
}
