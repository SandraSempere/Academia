import Link from "next/link";
import { getPatientsWithStatus, getProgressSummary } from "@/lib/patient";
import { PatientSearch } from "@/components/patient-search";

export const dynamic = "force-dynamic";

export default async function PacientesPage() {
  const { activas, finalizadas } = await getPatientsWithStatus();

  const [activasConProgreso, finalizadasConProgreso] = await Promise.all([
    Promise.all(
      activas.map(async (patient) => ({
        id: patient.id,
        name: patient.name,
        email: patient.email,
        blocked: patient.blocked,
        progress: patient.patientProfile
          ? await getProgressSummary(patient.patientProfile.id)
          : null,
      })),
    ),
    Promise.all(
      finalizadas.map(async (patient) => ({
        id: patient.id,
        name: patient.name,
        email: patient.email,
        blocked: patient.blocked,
        progress: patient.patientProfile
          ? await getProgressSummary(patient.patientProfile.id)
          : null,
      })),
    ),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">🗂️ Pacientes</h1>
        <Link
          href="/coach/pacientes/nueva"
          className="rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + Nueva paciente
        </Link>
      </div>

      <PatientSearch activas={activasConProgreso} finalizadas={finalizadasConProgreso} />
    </div>
  );
}
