import { getCurrentPatientProfile } from "@/lib/patient";
import { prisma } from "@/lib/prisma";
import { EatingChecklistForm } from "@/components/eating-checklist-form";

export const dynamic = "force-dynamic";

export default async function ComoComerPage() {
  const profile = await getCurrentPatientProfile();
  const existing = profile
    ? await prisma.eatingChecklist.findUnique({ where: { patientProfileId: profile.id } })
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">🍽️ Cómo comer, no solo qué comer</h1>
        <p className="mt-1 text-foreground/70">
          Tu checklist para digerir mejor y reconocer tu saciedad.
        </p>
      </div>

      <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <p className="font-semibold">Cómo usar este documento</p>
        <p className="mt-1 text-sm text-foreground/70">
          Es un documento vivo, no solo para leer una vez.
        </p>
        <ol className="mt-3 flex flex-col gap-2 text-sm text-foreground/70">
          <li>
            1. Marca las casillas de los 5 pasos según los vayas practicando
            — no hace falta hacerlos todos a la vez.
          </li>
          <li>
            2. Consulta la escala de hambre y saciedad cuando la necesites,
            para saber dónde parar.
          </li>
          <li>
            3. Cada día de esta semana, escribe una sola palabra en
            &ldquo;Mi semana&rdquo; sobre cómo te sentó la comida.
          </li>
        </ol>
        <p className="mt-3 text-sm text-foreground/70">
          Puedes imprimirlo y rellenarlo a mano, o escribir directamente en
          los campos si lo abres en el móvil u ordenador.
        </p>
        <a
          href="/uploads/recursos/como-comer-no-solo-que-comer.pdf"
          download
          className="mt-3 inline-flex items-center gap-1 self-start rounded-full bg-brand-primary px-4 py-2 text-xs font-medium text-white hover:opacity-90"
        >
          ⬇️ Descargar para imprimir y rellenar a mano
        </a>
      </div>

      <EatingChecklistForm data={existing} />

      <p className="rounded-lg bg-brand-tertiary-soft px-4 py-3 text-sm">
        🌿 No necesitas comer perfecto. Solo necesitas escuchar a tu cuerpo.
      </p>
    </div>
  );
}
