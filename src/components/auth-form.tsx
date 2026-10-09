"use client";

import { useActionState, useId } from "react";
import { signIn, signUp, type AuthState } from "@/app/login/actions";
import { NavLink } from "./nav-link";
import { Button } from "./ui/button";

export function AuthForm({
  mode,
  next,
  initialError,
}: {
  mode: "entrar" | "cadastrar";
  next?: string;
  initialError?: string;
}) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "entrar" ? signIn : signUp, {
    error: initialError,
  });
  const id = useId();

  if (state.confirmEmail) {
    return (
      <p role="status" className="border border-ink p-4 text-sm">
        Conta criada. Abra o e-mail que enviamos para <strong>{state.email}</strong> e confirme para entrar.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {mode === "entrar" && <input type="hidden" name="next" value={next ?? ""} />}
      {mode === "cadastrar" && (
        <div>
          <label htmlFor={`${id}-name`} className="field-label">
            Nome
          </label>
          <input
            id={`${id}-name`}
            name="name"
            autoComplete="name"
            required
            defaultValue={state.name}
            className="field"
          />
        </div>
      )}
      <div>
        <label htmlFor={`${id}-email`} className="field-label">
          E-mail
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          className="field"
        />
      </div>
      <div>
        <label htmlFor={`${id}-password`} className="field-label">
          Senha
        </label>
        <input
          id={`${id}-password`}
          name="password"
          type="password"
          autoComplete={mode === "entrar" ? "current-password" : "new-password"}
          minLength={mode === "cadastrar" ? 8 : undefined}
          required
          className="field"
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-signal">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Aguarde…" : mode === "entrar" ? "Entrar" : "Criar conta"}
      </Button>
      <p className="text-center text-sm text-ink/70">
        {mode === "entrar" ? (
          <>
            Ainda não tem conta?{" "}
            <NavLink href="/cadastro" className="font-semibold underline underline-offset-4">
              Criar conta
            </NavLink>
          </>
        ) : (
          <>
            Já tem conta?{" "}
            <NavLink href="/login" direction="back" className="font-semibold underline underline-offset-4">
              Entrar
            </NavLink>
          </>
        )}
      </p>
    </form>
  );
}
