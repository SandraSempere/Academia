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
    orderBy: { createdAt: "desc" },
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
