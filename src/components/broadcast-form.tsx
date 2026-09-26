"use client";

import { useActionState, useState } from "react";
import { sendBroadcast, type BroadcastResult } from "@/app/coach/avisos-actions";

type Recipient = {
  patientProfileId: string;
  name: string;
  email: string;
  blocked: boolean;
  hasPush: boolean;
};

const INITIAL_STATE: BroadcastResult = { sent: 0, pushDelivered: 0, failed: 0 };

export function BroadcastForm({ recipients }: { recipients: Recipient[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(recipients.map((r) => r.patientProfileId)));
  const [state, formAction, pending] = useActionState(sendBroadcast, INITIAL_STATE);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedCount = selected.size;
  const withoutPush = recipients.filter((r) => selected.has(r.patientProfileId) && !r.hasPush).length;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Destinatarias ({selectedCount})</p>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setSelected(new Set(recipients.map((r) => r.patientProfileId)))}
              className="text-brand-primary hover:underline"
            >
              Todas
            </button>
            <button type="button" onClick={() => setSelected(new Set())} className="text-brand-primary hover:underline">
              Ninguna
            </button>
          </div>
        </div>

        <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
          {recipients.map((r) => (
            <label
              key={r.patientProfileId}
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-black/5"
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="patientProfileId"
                  value={r.patientProfileId}
                  checked={selected.has(r.patientProfileId)}
                  onChange={() => toggle(r.patientProfileId)}
                />
                {r.name}
                {r.blocked && (
                  <span className="rounded-full bg-brand-primary-soft px-2 py-0.5 text-xs font-medium text-brand-primary">
                    🔒
                  </span>
                )}
              </span>
              {!r.hasPush && <span className="text-xs text-foreground/50">Sin push activado</span>}
            </label>
          ))}
        </div>

        {withoutPush > 0 && (
          <p className="text-xs text-foreground/60">
            {withoutPush} de las seleccionadas no tienen notificaciones push activadas — a esas solo les llegará por email.
          </p>
        )}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Asunto
        <input
          name="subject"
          required
          placeholder="Ej: Cambio de horario esta semana"
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Mensaje
        <textarea
          name="body"
          required
          rows={6}
          placeholder="Escribe el mensaje tal cual quieres que lo lean — se añade el saludo y la firma automáticamente en el email."
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      {!state.error && (state.sent > 0 || state.failed > 0) && (
        <p className="text-sm text-brand-primary">
          Enviado a {state.sent} paciente{state.sent === 1 ? "" : "s"} ({state.pushDelivered} por push + email,{" "}
          {state.sent - state.pushDelivered} solo por email)
          {state.failed > 0 && ` · ${state.failed} fallaron`}.
        </p>
      )}

      <button
        type="submit"
        disabled={pending || selectedCount === 0}
        className="self-start rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Enviando..." : `Enviar aviso a ${selectedCount}`}
      </button>
    </form>
  );
}
