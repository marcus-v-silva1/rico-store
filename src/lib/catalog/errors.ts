/** Mensagem em português para um erro do banco ao salvar produto. */
export function describeSaveError(e: { code?: string; message?: string } | null): string {
  if (e?.code === "23505") {
    if (e.message?.includes("products_slug_key")) {
      return "Já existe um produto com esse endereço. Mude o nome ou o endereço.";
    }
    if (e.message?.includes("product_variants_sku_key")) return "Esse código (SKU) já é usado por outra peça.";
  }
  if (e?.code === "42501") return "Você não tem permissão para salvar produtos.";
  return "Não foi possível salvar. Tente de novo.";
}
