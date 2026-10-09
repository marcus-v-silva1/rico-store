import type { GarmentKind } from "@/content/catalog";

// Silhuetas planas das peças, no estilo do layout: forma cheia + costuras em traço fino.
// Servem de foto provisória até o catálogo ter fotografia real.
const SHAPES: Record<GarmentKind, { body: string; seams: string[] }> = {
  jacket: {
    body: "M70 30 Q100 42 130 30 L152 42 L186 78 L176 196 L152 192 L148 208 H52 L48 192 L24 196 L14 78 L48 42 Z",
    seams: ["M100 38 V208", "M50 82 H150", "M50 122 H150", "M50 162 H150", "M48 42 L52 192", "M152 42 L148 192"],
  },
  hoodie: {
    body: "M72 38 Q100 -4 128 38 L152 48 L186 84 L176 200 L150 196 L148 212 H52 L50 196 L24 200 L14 84 L48 48 Z",
    seams: ["M72 38 Q100 62 128 38", "M100 60 V90", "M66 150 H134 L128 190 H72 Z", "M52 196 H148"],
  },
  tee: {
    body: "M70 28 Q100 48 130 28 L170 52 L156 94 L138 86 L138 208 H62 L62 86 L44 94 L30 52 Z",
    seams: ["M70 28 Q100 40 130 28", "M62 198 H138"],
  },
  pants: {
    body: "M62 14 H138 L146 222 H108 L100 94 L92 222 H54 Z",
    seams: ["M62 30 H138", "M100 30 V94", "M70 120 H88 V148 H70 Z", "M112 120 H130 V148 H112 Z"],
  },
  shorts: {
    body: "M60 38 H140 L150 164 H108 L100 100 L92 164 H50 Z",
    seams: ["M60 52 H140", "M100 52 V100", "M62 118 H82"],
  },
  cap: {
    body: "M38 152 Q38 70 104 66 Q166 68 170 152 Z M118 148 Q172 140 196 166 Q152 172 118 160 Z",
    seams: ["M104 66 V152", "M70 78 Q66 114 72 152", "M138 78 Q142 114 136 152", "M38 140 H170"],
  },
  sneaker: {
    body: "M16 150 Q58 144 84 118 L102 128 Q124 142 158 146 Q188 150 188 170 V182 H16 Z",
    seams: ["M16 172 H188", "M88 124 L98 142", "M104 130 L112 146", "M120 136 L126 150"],
  },
  bag: {
    body: "M46 84 H154 Q160 84 160 92 V188 Q160 196 152 196 H48 Q40 196 40 188 V92 Q40 84 46 84 Z",
    seams: ["M40 120 H160", "M92 120 V136 H108 V120", "M60 84 Q100 -8 140 84"],
  },
};

/** Cor da costura que contrasta com a cor da peça. */
function seamColor(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.55 ? "rgba(15,15,15,0.35)" : "rgba(246,245,241,0.26)";
}

export function Garment({ kind, color, className }: { kind: GarmentKind; color: string; className?: string }) {
  const shape = SHAPES[kind];
  const line = seamColor(color);
  return (
    <svg viewBox="0 0 200 240" fill="none" aria-hidden="true" className={className}>
      <path d={shape.body} fill={color} fillRule="evenodd" stroke="rgba(15,15,15,0.18)" strokeWidth="1" />
      {shape.seams.map((d) => (
        <path key={d} d={d} stroke={line} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}
