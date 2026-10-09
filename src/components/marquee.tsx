/** Faixa de marcas que corre na horizontal. A segunda cópia fecha o ciclo e fica oculta para leitores de tela. */
export function Marquee({ items }: { items: readonly string[] }) {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <li key={item} className="flex items-center">
          <span className="display whitespace-nowrap text-[clamp(2rem,6vw,4.25rem)] leading-none">{item}</span>
          <span className="display px-[0.5em] text-[clamp(2rem,6vw,4.25rem)] leading-none text-bone/30">/</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="overflow-hidden">
      <div className="marquee-track flex w-max animate-marquee">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
