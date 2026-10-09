import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[88rem] px-(--gutter) py-24">
      <p className="label text-stone">Erro 404</p>
      <h1 className="display mt-3 text-[clamp(2.75rem,8vw,5.5rem)]">Página não encontrada</h1>
      <p className="mt-4 max-w-md text-sm text-ink/80">O endereço não existe ou a peça saiu do ar.</p>
      <LinkButton href="/" direction="back" className="mt-8">
        Voltar para a loja
      </LinkButton>
    </div>
  );
}
