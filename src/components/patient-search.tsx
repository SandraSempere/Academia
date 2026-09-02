"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type PatientRow = {
  id: string;
  name: string;
  email: string;
  blocked: boolean;
  progress: { completedItems: number; totalItems: number; percent: number } | null;
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export function PatientSearch({
  activas,
  finalizadas,
}: {
  activas: PatientRow[];
  finalizadas: PatientRow[];
}) {
  const [query, setQuery] = useState("");

  const { filteredActivas, filteredFinalizadas } = useMemo(() => {
    const q = normalize(query);
    if (!q) return { filteredActivas: activas, filteredFinalizadas: finalizadas };
    const matches = (p: PatientRow) => normalize(p.name).includes(q) || normalize(p.email).includes(q);
    return { filteredActivas: activas.filter(matches), filteredFinalizadas: finalizadas.filter(matches) };
  }, [query, activas, finalizadas]);

  return (
    <div className="flex flex-col gap-8">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nombre o email..."
        className="rounded-full border border-black/10 bg-blanco-roto px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
      />

      <PatientGroup title={`Activas (${filteredActivas.length})`} entries={filteredActivas} searching={!!query.trim()} />
      <PatientGroup
        title={`Finalizadas (${filteredFinalizadas.length})`}
        entries={filteredFinalizadas}
        searching={!!query.trim()}
      />
    </div>
  );
}

function PatientGroup({
  title,
  entries,
  searching,
}: {
  title: string;
  entries: PatientRow[];
  searching: boolean;
}) {
  return (
    <details open={searching} className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
      <summary className="cursor-pointer text-lg font-semibold">{title}</summary>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-foreground/60">No hay pacientes en este grupo.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {entries.map((patient) => (
            <Link
              key={patient.id}
              href={`/coach/pacientes/${patient.id}`}
              className="flex items-center justify-between rounded-xl border border-black/5 bg-blanco-roto p-4 hover:border-brand-primary"
            >
              <div>
                <p className="font-medium">
                  {patient.name}
                  {patient.blocked && (
                    <span className="ml-2 rounded-full bg-brand-primary-soft px-2 py-0.5 text-xs font-medium text-brand-primary">
                      🔒 Bloqueada
                    </span>
                  )}
                </p>
                <p className="text-sm text-foreground/60">{patient.email}</p>
              </div>
              {patient.progress && (
                <span className="text-sm text-foreground/60">
                  {patient.progress.completedItems}/{patient.progress.totalItems} pasos ·{" "}
                  {patient.progress.percent}%
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </details>
  );
}
