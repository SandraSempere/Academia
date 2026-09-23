import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentPatientProfile() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PATIENT") return null;

  return prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    include: { plan: true },
  });
}

export async function getPatientsWithStatus() {
  const patients = await prisma.user.findMany({
    where: { role: "PATIENT" },
    orderBy: { name: "asc" },
    include: {
      patientProfile: {
        include: {
          symptomForm: true,
          quincenalForms: true,
          celebrationForm: true,
          ruleAuditForm: true,
          commitmentForm: true,
          closingForm: true,
        },
      },
    },
  });

  const activas = patients.filter((p) => !p.patientProfile?.closingForm?.submittedAt);
  const finalizadas = patients.filter((p) => p.patientProfile?.closingForm?.submittedAt);

  return { patients, activas, finalizadas };
}

// Nombre + primer apellido en cuanto la paciente rellena el Formulario de
// síntomas (que sí pide nombre y apellidos por separado) — antes de eso solo
// existe el nombre suelto que se puso al darla de alta. Sirve para
// distinguir a dos pacientes con el mismo nombre en el listado. Solo el
// primer apellido (no todos) aunque escriba varios en el campo "Apellidos".
export function patientDisplayName(patient: {
  name: string;
  patientProfile?: {
    symptomForm?: { submittedAt: Date | null; firstName: string | null; lastName: string | null } | null;
  } | null;
}) {
  const form = patient.patientProfile?.symptomForm;
  if (form?.submittedAt && form.firstName) {
    const firstSurname = form.lastName?.trim().split(/\s+/)[0];
    return firstSurname ? `${form.firstName} ${firstSurname}` : form.firstName;
  }
  return patient.name;
}

export async function getProgressSummary(patientProfileId: string) {
  const [totalItems, completedItems] = await Promise.all([
    prisma.weekBlockItemTemplate.count(),
    prisma.patientChecklistItem.count({
      where: { patientProfileId, completed: true },
    }),
  ]);

  return {
    totalItems,
    completedItems,
    percent: totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100),
  };
}
