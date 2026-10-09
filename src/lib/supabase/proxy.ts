import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import { isProtected } from "@/lib/roles";

/**
 * Renova a sessão e barra quem não entrou. É só a primeira barreira, otimista:
 * o papel de verdade é conferido no banco por `requireRole()` em cada página.
 */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!isSupabaseConfigured()) {
    if (!isProtected(path)) return NextResponse.next({ request });
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getClaims valida o JWT; não use getSession aqui.
  const { data } = await supabase.auth.getClaims();
  const signedIn = !!data?.claims;

  if (!signedIn && isProtected(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }

  if (signedIn && (path === "/login" || path === "/cadastro")) {
    const url = request.nextUrl.clone();
    url.pathname = "/conta";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}
