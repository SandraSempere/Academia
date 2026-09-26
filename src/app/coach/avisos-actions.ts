"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyPatient } from "@/lib/notify";
import { sendCoachBroadcastEmail } from "@/lib/email";

async function requireCoach() {
  const session = await auth();
  if (!session?.user || session.user.role !== "COACH") {
    throw new Error("No autorizado");
  }
}

export type BroadcastResult = {
  sent: number;
  pushDelivered: number;
  failed: number;
  error?: string;
};

// Manda el mismo aviso (push + email, igual que el resto de notificaciones
// de la app) a varias pacientes a la vez. Con Promise.allSettled en vez de
// Promise.all porque aquí sí puede fallar una paciente suelta (email
// inválido, lo que sea) sin que eso tumbe el envío al resto — es la primera
// vez en la app que se notifica a un grupo en vez de a una paciente sola.
export async function sendBroadcast(
  _prev: BroadcastResult | null,
  formData: FormData,
): Promise<BroadcastResult> {
  await requireCoach();

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const patientProfileIds = formData.getAll("patientProfileId").map(String);

  if (!subject) return { sent: 0, pushDelivered: 0, failed: 0, error: "Escribe un asunto." };
  if (!body) return { sent: 0, pushDelivered: 0, failed: 0, error: "Escribe un mensaje." };
  if (patientProfileIds.length === 0) {
    return { sent: 0, pushDelivered: 0, failed: 0, error: "Elige al menos una paciente." };
  }

  const patients = await prisma.patientProfile.findMany({
    where: { id: { in: patientProfileIds } },
    include: { user: true },
  });

  const results = await Promise.allSettled(
    patients.map((patient) =>
      notifyPatient(
        patient.id,
        { title: subject, body, url: "/" },
        () => sendCoachBroadcastEmail(patient.user.email, patient.user.name, subject, body, patient.id),
        "coach_broadcast",
      ),
    ),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const pushDelivered = results.filter((r) => r.status === "fulfilled" && r.value.pushDelivered).length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return { sent, pushDelivered, failed };
}
