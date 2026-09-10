import { prisma } from "@/lib/prisma";
import { sendPatientAppointmentReminderEmail } from "@/lib/email";
import { notifyPatient } from "@/lib/notify";

// Citas de revisión creadas solas por el calendario de Revisiones (ver
// src/lib/revisiones.ts y coach/actions.ts) — semana 4/8/12 del ciclo
// original, sus equivalentes de renovación, y la revisión final del mes
// extra (semana 16). No incluye citas sueltas creadas a mano desde la
// Agenda (esas no tienen "source").
export const REVISION_SOURCES = [
  "revision4",
  "revision8",
  "revision12",
  "renewal_revision4",
  "renewal_revision8",
  "renewal_revision12",
  "extra_month_revision_final",
];

export function appointmentReminderPush(label: string, date: Date, when: "hoy" | "mañana") {
  const timeLabel = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return {
    title: "📅 Recordatorio de tu cita de revisión",
    body: `${when === "hoy" ? "Hoy" : "Mañana"} a las ${timeLabel} — ${label}.`,
    url: "/progreso",
  };
}

// Manda el recordatorio de UNA cita concreta ahora mismo — sin mirar la
// fecha ni el "ya avisado" (eso lo hace el cron diario, ver
// src/app/api/cron/appointment-reminders/route.ts, que reutiliza estas
// mismas funciones). Pensado para el botón de prueba del panel de coach,
// para poder comprobar en caliente si el push llega de verdad a una cita
// concreta sin esperar al día siguiente. Devuelve si el push se entregó,
// para poder mostrarlo — el email nunca lanza así que no hace falta
// comprobarlo aparte.
export async function sendAppointmentReminderNow(appointmentId: string, when: "hoy" | "mañana" = "hoy") {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { patientProfile: { include: { user: true } } },
  });
  if (!appt?.patientProfile) throw new Error("Cita no encontrada o sin paciente asociada");

  const label = appt.notes ?? "tu cita de revisión";
  const { user } = appt.patientProfile;

  return notifyPatient(appt.patientProfile.id, appointmentReminderPush(label, appt.date, when), () =>
    sendPatientAppointmentReminderEmail(user.email, user.name ?? "", appt.date),
  );
}
