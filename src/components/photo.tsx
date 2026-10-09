import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Foto do layout. Sem `src`, mostra um quadro provisório com o nome do slot:
 * coloque a imagem em `public/images/` e passe o caminho aqui.
 */
export function Photo({
  src,
  alt = "",
  slot,
  className,
  priority,
}: {
  src?: string;
  alt?: string;
  /** Nome do espaço, exibido só no quadro provisório. */
  slot: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-graphite", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 64rem) 25vw, 70vw"
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-end bg-[linear-gradient(135deg,#242424_0%,#121212_60%),repeating-linear-gradient(45deg,transparent_0_14px,rgba(255,255,255,0.025)_14px_15px)] p-3"
          role="img"
          aria-label={`Espaço reservado para foto: ${slot}`}
        >
          <span className="label text-[0.625rem] text-bone/45">Foto / {slot}</span>
        </div>
      )}
    </div>
  );
}
