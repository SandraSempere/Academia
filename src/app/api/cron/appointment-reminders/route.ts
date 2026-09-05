import { prisma } from "@/lib/prisma";
import { isSameDay, isTimeTbd } from "@/lib/revisiones";
import { sendPatientAppointmentReminderEmail } from "@/lib/email";
import { notifyPatient } from "@/lib/notify";

// Citas de revisión creadas solas por el calendario de Revisiones (ver
// src/lib/revisiones.ts y coach/actions.ts) — semana 4/8/12 del ciclo
// original, sus equivalentes de renovación, y la revisión final del mes
// extra (semana 16). No incluye citas sueltas creadas a mano desde la
// Agenda (esas no tienen "source").
const REVISION_SOURCES = [
  "revision4",
  "revision8",
  "revision12",
  "renewal_revision4",
  "renewal_revision8",
  "renewal_revision12",
  "extra_month_revision_final",
];

function reminderPush(label: string, date: Date, when: "hoy" | "mañana") {
  const timeLabel = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return {
    title: "📅 Recordatorio de tu cita de revisión",
    body: `${when === "hoy" ? "Hoy" : "Mañana"} a las ${timeLabel} — ${label}.`,
    url: "/progreso",
  };
}

// Comprobación diaria: a qué pacientes les toca (mañana o hoy) una cita de
// revisión — les manda un recordatorio (email siempre, y notificación push
// además si están suscritas), el día antes y el día exacto, cada uno con
// su propio "ya avisado" para no repetirlo. Ignora las citas todavía "sin
// hora" (marcador 00:00 = falta por coordinar con la paciente) — avisar de
// una cita sin hora real no tiene sentido.
//
// En producción la llama un cron aparte de Railway, programado a las 9:00
// (así el aviso del mismo día llega justo a esa hora) — mismo CRON_SECRET
// que /api/cron/form-reminders.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = new URL(request.url).searchParams.get("secret");
    if (provided !== secret) {
      return new Response("No autorizado", { status: 401 });
    }
  }

  const appointments = await prisma.appointment.findMany({
    where: { source: { in: REVISION_SOURCES }, patientProfileId: { not: null } },
    include: { patientProfile: { include: { user: true } } },
  });

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let remindersSent = 0;

  for (const appt of appointments) {
    if (!appt.patientProfile) continue;
    if (isTimeTbd(appt.date)) continue;

    const when: "hoy" | "mañana" | null = isSameDay(appt.date, today)
      ? "hoy"
      : isSameDay(appt.date, tomorrow)
        ? "mañana"
        : null;
    if (!when) continue;

    const sentField = when === "hoy" ? "reminderSentAt" : "reminderSentDayBeforeAt";
    if (appt[sentField]) continue;

    await prisma.appointment.update({ where: { id: appt.id }, data: { [sentField]: today } });

    const label = appt.notes ?? "tu cita de revisión";
    const { user } = appt.patientProfile;
    await notifyPatient(appt.patientProfile.id, reminderPush(label, appt.date, when), () =>
      sendPatientAppointmentReminderEmail(user.email, user.name ?? "", appt.date),
    );
    remindersSent++;
  }

  return Response.json({ checked: appointments.length, remindersSent });
}
