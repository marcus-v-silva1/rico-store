/** O que falta para publicar o produto. Lista vazia = pode publicar. */
export function publishProblems(p: { variants: { stock: number }[]; imageCount: number }): string[] {
  const problems: string[] = [];
  if (!p.variants.some((v) => v.stock > 0)) {
    problems.push("Cadastre estoque em pelo menos uma cor e tamanho.");
  }
  if (p.imageCount < 1) problems.push("Envie pelo menos uma foto.");
  return problems;
}
