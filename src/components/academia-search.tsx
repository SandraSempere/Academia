"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function AcademiaSearch({
  searchIndex,
  children,
}: {
  searchIndex: { id: string; text: string }[];
  children: ReactNode[];
}) {
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const matchIds = q ? new Set(searchIndex.filter((m) => m.text.includes(q)).map((m) => m.id)) : null;

  // Al buscar, despliega también los <details> internos (lección o recurso
  // concretos) del módulo que ha hecho match, para no obligar a la paciente
  // a abrir uno a uno para encontrar lo que buscaba.
  useEffect(() => {
    if (!matchIds || !containerRef.current) return;
    for (const id of matchIds) {
      const moduleEl = containerRef.current.querySelector(`[data-module-id="${id}"]`);
      moduleEl?.querySelectorAll("details").forEach((d) => {
        d.open = true;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar una lección o documento..."
        className="rounded-full border border-black/10 bg-blanco-roto px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
      />

      {matchIds && matchIds.size === 0 && (
        <p className="text-sm text-foreground/60">No se ha encontrado nada con &quot;{query}&quot;.</p>
      )}

      <div ref={containerRef} className="flex flex-col gap-4">
        {searchIndex.map((entry, i) => (
          <div key={entry.id} data-module-id={entry.id} hidden={matchIds ? !matchIds.has(entry.id) : false}>
            {children[i]}
          </div>
        ))}
      </div>
    </div>
  );
}
