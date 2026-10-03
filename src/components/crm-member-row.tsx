"use client";

import { useState, useTransition } from "react";
import {
  resendCrmInvite,
  setCrmMemberActive,
  setCrmMemberTakesCalls,
  updateCrmMember,
} from "@/app/crm/equipo/actions";
import { InviteResult } from "@/components/crm-invite-form";

type Member = {
  id: string;
  name: string;
  email: string;
  role: "COACH" | "SETTER" | "CLOSER";
  active: boolean;
  takesCalls: boolean;
  lastSeen: string | null;
  pendingInvite: boolean;
};

const ROLE_LABELS = { COACH: "Admin", SETTER: "Setter", CLOSER: "Closer" } as const;

export function CrmMemberRow({ member }: { member: Member }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<{ inviteUrl: string; emailSent: boolean } | null>(null);
  const isAdmin = member.role === "COACH";

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      setError(null);
      try {
        await fn();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar.");
      }
    });
  }

  return (
    <div className={`rounded-2xl bg-blanco-roto p-5 shadow-sm ${member.active ? "" : "opacity-70"}`}>
      {editing ? (
        <form
          action={(formData) =>
            run(async () => {
              await updateCrmMember(member.id, formData);
              setEditing(false);
            })
          }
          className="flex flex-wrap items-end gap-3"
        >
          <label className="flex flex-col gap-1 text-sm">
            Nombre real
            <input
              name="name"
              defaultValue={member.name}
              required
              className="rounded-lg border border-black/10 bg-white px-3 py-2 outline-none focus:border-brand-primary"
            />
          </label>
          {!isAdmin && (
            <label className="flex flex-col gap-1 text-sm">
              Rol
              <select
                name="role"
                defaultValue={member.role}
                className="rounded-lg border border-black/10 bg-white px-3 py-2 outline-none focus:border-brand-primary"
              >
                <option value="SETTER">Setter</option>
                <option value="CLOSER">Closer</option>
              </select>
            </label>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-sm text-foreground/60 hover:text-foreground"
          >
            Cancelar
          </button>
        </form>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold">
              {member.name}{" "}
              <span className="ml-1 rounded-full bg-brand-tertiary-soft px-2 py-0.5 text-xs font-normal">
                {ROLE_LABELS[member.role]}
              </span>{" "}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-normal ${
                  member.active ? "bg-brand-tertiary text-white" : "bg-black/10"
                }`}
              >
                {member.active ? "Activo" : "Desactivado"}
              </span>
            </p>
            <p className="mt-1 break-all text-sm text-foreground/60">{member.email}</p>
            {member.lastSeen !== null && (
              <p className="mt-1 text-sm text-foreground/60">
                Última conexión: {member.pendingInvite ? "todavía no ha entrado (invitación pendiente)" : member.lastSeen}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={member.takesCalls}
                disabled={pending}
                onChange={(e) => run(() => setCrmMemberTakesCalls(member.id, e.target.checked))}
                className="h-4 w-4 accent-brand-primary"
              />
              Hace llamadas
            </label>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-sm text-brand-primary hover:opacity-80"
            >
              Editar
            </button>
            {!isAdmin && member.active && member.pendingInvite && (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(async () => setInvite(await resendCrmInvite(member.id)))}
                className="text-sm text-brand-primary hover:opacity-80"
              >
                Reenviar invitación
              </button>
            )}
            {!isAdmin && (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (
                    member.active &&
                    !confirm(`¿Desactivar el acceso de ${member.name}? Se le cerrará la sesión al momento.`)
                  ) {
                    return;
                  }
                  run(() => setCrmMemberActive(member.id, !member.active));
                }}
                className={`rounded-full px-3 py-1 text-sm ${
                  member.active
                    ? "border border-black/10 text-foreground/70 hover:border-brand-primary hover:text-brand-primary"
                    : "bg-brand-primary text-white hover:opacity-90"
                }`}
              >
                {member.active ? "Desactivar acceso" : "Activar acceso"}
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-brand-primary">{error}</p>}
      {invite && (
        <div className="mt-3">
          <InviteResult {...invite} />
        </div>
      )}
    </div>
  );
}
