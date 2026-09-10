import { prisma } from "@/lib/prisma";
import { isSameDay, isTimeTbd } from "@/lib/revisiones";
import { REVISION_SOURCES, appointmentReminderPush } from "@/lib/appointment-reminder";
import { sendPatientAppointmentReminderEmail } from "@/lib/email";
import { notifyPatient } from "@/lib/notify";

// Comprobación diaria: a qué pacientes les toca (mañana o hoy) una cita de
// revisión — les manda un recordatorio (email siempre, y notificación push
// además si están suscritas), el día antes y el día exacto, cada uno con
// su propio "ya avisado" para no repetirlo. Ignora las citas todavía "sin
// hora" (marcador 00:00 = falta por coordinar con la paciente). El botón
// "🔁 Reenviar recordatorio (prueba)" de la Agenda usa el mismo
// `appointmentReminderPush`/`notifyPatient` que aquí (ver
// src/lib/appointment-reminder.ts) para poder probar en caliente.
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
    const { pushDelivered } = await notifyPatient(appt.patientProfile.id, appointmentReminderPush(label, appt.date, when), () =>
      sendPatientAppointmentReminderEmail(user.email, user.name ?? "", appt.date),
    );
    console.log(
      `[appointment-reminders] cita=${appt.id} paciente=${appt.patientProfile.id} when=${when} pushDelivered=${pushDelivered}`,
    );
    remindersSent++;
  }

  return Response.json({ checked: appointments.length, remindersSent });
}
