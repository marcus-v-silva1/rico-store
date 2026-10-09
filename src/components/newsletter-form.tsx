"use client";

import { useActionState, useId } from "react";
import { subscribe, type FormState } from "@/app/actions";
import { Button } from "./ui/button";

export function NewsletterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribe, {});
  const id = useId();

  if (state.ok) {
    return (
      <p role="status" className="text-sm text-bone">
        Pronto. Você vai receber os lançamentos por e-mail.
      </p>
    );
  }

  return (
    <form action={action} className="on-dark">
      <label htmlFor={id} className="mb-2 block text-xs font-semibold">
        Receba os lançamentos por e-mail
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="seu@email.com"
          defaultValue={state.email}
          className="field !border-smoke bg-ink text-sm"
        />
        <Button type="submit" variant="light" disabled={pending}>
          {pending ? "Enviando…" : "Inscrever"}
        </Button>
      </div>
      {state.error && (
        <p role="alert" className="mt-2 text-xs text-signal">
          {state.error}
        </p>
      )}
    </form>
  );
}
