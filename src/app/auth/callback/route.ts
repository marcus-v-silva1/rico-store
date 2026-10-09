import { NextResponse, type NextRequest } from "next/server";
import { homeFor } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

/** Destino do link de confirmação enviado por e-mail. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    // Quem acaba de confirmar o e-mail é sempre cliente.
    if (!error) return NextResponse.redirect(`${origin}${homeFor("cliente")}`);
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
