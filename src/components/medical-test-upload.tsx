"use client";

import { useRef, useState, useTransition } from "react";
import { uploadMedicalTests } from "@/app/(app)/actions";

type MedicalTestData = {
  id: string;
  fileName: string;
  uploadedAt: Date | string;
};

// Un poco por debajo del límite real del servidor (100mb, ver
// next.config.ts) para avisar con un mensaje claro antes de que el
// navegador ni siquiera intente mandar la petición, en vez de dejar que
// falle con un error de red genérico a mitad de la subida.
const MAX_TOTAL_BYTES = 90 * 1024 * 1024;

export function MedicalTestUpload({ tests }: { tests: MedicalTestData[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-blanco-roto p-5">
      <p className="text-xs text-foreground/60">
        Analíticas, ecografías u otras pruebas que tengas. Puedes subir varios
        archivos a la vez o uno a uno (PDF o foto).
      </p>

      <form
        ref={formRef}
        action={(formData) =>
          startTransition(async () => {
            setError(null);

            const files = formData.getAll("files").filter((f): f is File => f instanceof File);
            const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
            if (totalBytes > MAX_TOTAL_BYTES) {
              setError(
                `Ese conjunto de archivos pesa demasiado (${(totalBytes / (1024 * 1024)).toFixed(0)} MB). Prueba a subirlos en un par de tandas más pequeñas.`,
              );
              return;
            }

            try {
              await uploadMedicalTests(formData);
              formRef.current?.reset();
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "No se pudo subir. Prueba a subir menos archivos a la vez o inténtalo de nuevo.",
              );
            }
          })
        }
        className="flex flex-wrap items-center gap-2"
      >
        <input
          type="file"
          name="files"
          multiple
          required
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="min-w-0 flex-1 text-xs file:mr-2 file:rounded-full file:border-0 file:bg-brand-primary-soft file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-brand-primary"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-brand-primary px-4 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Subiendo..." : "Subir"}
        </button>
      </form>

      {error && (
        <p className="rounded-lg bg-brand-primary-soft px-3 py-2 text-xs text-carbon">{error}</p>
      )}

      {tests.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-black/5 pt-3">
          {tests.map((test) => (
            <div key={test.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0 flex-1 truncate">📎 {test.fileName}</span>
              <span className="shrink-0 text-foreground/50">
                {new Date(test.uploadedAt).toLocaleDateString("es-ES")}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
