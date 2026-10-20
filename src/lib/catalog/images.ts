export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type ImageType = (typeof IMAGE_TYPES)[number];
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const EXTENSION: Record<ImageType, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

function isImageType(type: string): type is ImageType {
  return (IMAGE_TYPES as readonly string[]).includes(type);
}

export function checkImageFile(f: { type: string; size: number }): string | null {
  // Arquivo vazio não é foto, mesmo com o tipo certo.
  if (!isImageType(f.type) || f.size <= 0) return "Envie uma foto em JPEG, PNG ou WebP.";
  if (f.size > IMAGE_MAX_BYTES) return "A foto passa de 5 MB. Diminua e envie de novo.";
  return null;
}

/**
 * Caminho no bucket: `${productId}/${id}.${ext}`. A extensão sai do tipo do arquivo
 * (o nome vem do computador de quem envia e pode mentir). Passe só tipos aceitos por `checkImageFile`.
 */
export function imagePath(productId: string, type: string, id: string): string {
  if (!isImageType(type)) throw new Error(`Tipo de foto não aceito: ${type}`);
  return `${productId}/${id}.${EXTENSION[type]}`;
}
