import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { isSupabaseConfigured } from "@/lib/env";
import { safeInternalPath } from "@/lib/roles";

export const metadata: Metadata = { title: "Entrar" };

const ERRORS: Record<string, string> = {
  link: "O link expirou ou já foi usado. Entre com e-mail e senha.",
};

async function LoginForm({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? (safeInternalPath(params.next) ?? undefined) : undefined;
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;
  return <AuthForm mode="entrar" next={next} initialError={error} />;
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthShell title="Entrar" subtitle="Acesse sua conta, seus pedidos e o painel da loja.">
      {!isSupabaseConfigured() && (
        <p className="mb-6 border border-signal p-3 text-sm" role="note">
          O Supabase ainda não está configurado. Veja o README para ligar o login.
        </p>
      )}
      <Suspense fallback={<AuthForm mode="entrar" />}>
        <LoginForm searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}
