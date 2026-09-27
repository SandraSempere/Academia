"use client";

import { useState, type ReactNode } from "react";

type Tab = { id: string; label: string; content: ReactNode };

// Mismo patrón de pastillas que "Tu compra saludable" — solo se renderiza el
// contenido de la pestaña activa (no se ocultan las demás con CSS), para no
// tener montados a la vez los ~6 apartados de una ficha de paciente.
export function PatientDetailTabs({ tabs }: { tabs: Tab[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveId(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeId === t.id
                ? "bg-brand-secondary text-blanco-roto"
                : "border border-black/10 text-foreground/70 hover:bg-brand-secondary-soft/40"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active && <div className="flex flex-col gap-4">{active.content}</div>}
    </div>
  );
}
