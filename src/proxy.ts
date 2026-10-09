import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// A vitrine pública não passa pelo Supabase: só as áreas com login.
export const config = {
  matcher: ["/admin/:path*", "/atendimento/:path*", "/conta/:path*", "/login", "/cadastro"],
};
