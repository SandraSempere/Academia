"use client";

import { useRef, useState, useTransition } from "react";
import { inviteCrmMember } from "@/app/crm/equipo/actions";

export function CrmInviteForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ inviteUrl: string; emailSent: boolean } | null>(null);
  const [role, setRole] = useState<"SETTER" | "CLOSER">("SETTER");

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          setError(null);
          setResult(null);
          try {
            setResult(await inviteCrmMember(formData));
            formRef.current?.reset();
            setRole("SETTER");
          } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo enviar la invitación.");
          }
        })
      }
      className="flex flex-col gap-4"
    >
      {error && (
        <p className="rounded-lg bg-brand-primary-soft px-4 py-3 text-sm text-brand-primary">{error}</p>
      )}
      {result && <InviteResult {...result} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Nombre real
          <input
            name="name"
            required
            placeholder="p.ej. Lorena García"
            className="rounded-lg border border-black/10 bg-white px-3 py-2 outline-none focus:border-brand-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-lg border border-black/10 bg-white px-3 py-2 outline-none focus:border-brand-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Rol
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as "SETTER" | "CLOSER")}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 outline-none focus:border-brand-primary"
          >
            <option value="SETTER">Setter</option>
            <option value="CLOSER">Closer</option>
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          {/* Por defecto marcada para closers (son quienes hacen las llamadas). */}
          <input
            key={role}
            type="checkbox"
            name="takesCalls"
            defaultChecked={role === "CLOSER"}
            className="h-4 w-4 accent-brand-primary"
          />
          Hace llamadas
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Enviar invitación"}
      </button>
    </form>
  );
}

export function InviteResult({ inviteUrl, emailSent }: { inviteUrl: string; emailSent: boolean }) {
  return (
    <div
      className={`rounded-lg px-4 py-3 text-sm ${emailSent ? "bg-brand-tertiary-soft" : "bg-brand-primary-soft"}`}
    >
      <p>
        {emailSent
          ? "🌿 Invitación enviada por email (válida 7 días)."
          : "⚠️ No se ha podido enviar el email. Pásale tú este enlace (válido 7 días):"}
      </p>
      {!emailSent && <p className="mt-2 break-all font-mono text-xs">{inviteUrl}</p>}
    </div>
  );
}
