import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignUpPage() {
  return (
    <AuthShell title="Criar conta" subtitle="Compre mais rápido e acompanhe seus pedidos.">
      <AuthForm mode="cadastrar" />
    </AuthShell>
  );
}
