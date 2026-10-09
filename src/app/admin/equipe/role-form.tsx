"use client";

import { useActionState, useId } from "react";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL, ROLES, type Role } from "@/lib/roles";
import { setRole, type RoleState } from "./actions";

export function RoleForm({ userId, role, disabled }: { userId: string; role: Role; disabled?: boolean }) {
  const [state, action, pending] = useActionState<RoleState, FormData>(setRole, {});
  const id = useId();
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <label htmlFor={id} className="sr-only">
        Papel
      </label>
      <select id={id} name="role" defaultValue={role} disabled={disabled} className="field !w-auto !py-2 text-sm">
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="outline" disabled={disabled || pending}>
        {pending ? "Salvando…" : "Salvar"}
      </Button>
      {state.ok && (
        <span role="status" className="text-xs text-olive">
          Salvo
        </span>
      )}
      {state.error && (
        <span role="alert" className="text-xs font-semibold text-signal">
          {state.error}
        </span>
      )}
    </form>
  );
}
