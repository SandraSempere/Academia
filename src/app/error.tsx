"use client";

import { useEffect } from "react";

// Cuando desplegamos código nuevo mientras alguien tiene una página abierta,
// las Server Actions (subir un plan, un recurso, marcar una revisión...) de
// esa página quedan referenciando una versión que el servidor ya no
// reconoce — Next.js lo señala con "Failed to find Server Action". No es un
// fallo real de la subida ni del almacenamiento, solo hay que recargar para
// volver a hablar con la versión actual. Antes esto se veía como un error
// en bruto sin explicación; ahora se detecta y se recarga sola.
const STALE_DEPLOY_PATTERN = /Failed to find Server Action/i;

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const isStaleDeploy = STALE_DEPLOY_PATTERN.test(error.message);

  useEffect(() => {
    if (isStaleDeploy) {
      window.location.reload();
    }
  }, [isStaleDeploy]);

  if (isStaleDeploy) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm text-foreground/60">Actualizando la app…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-lg font-medium">Algo ha ido mal.</p>
      <p className="text-sm text-foreground/60">Inténtalo de nuevo. Si sigue fallando, avisa a Jordi.</p>
      <button
        onClick={reset}
        className="rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
