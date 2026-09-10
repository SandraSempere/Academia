// Punto único para avisar a una paciente de algo (recordatorio de
// formulario, plan nutricional nuevo, vídeo de respuesta...): manda
// siempre el email, y además la notificación push si la tiene activada.
// Sandra pidió expresamente los dos a la vez (no solo el email como
// respaldo del push) — mucha gente desactiva las notificaciones y se le
// puede olvidar, así que el email es quien de verdad no falla.
import { sendPushToPatient } from "@/lib/push";

// Devuelve si el push se entregó (útil para depurar en caliente desde el
// panel de coach) — quien no lo necesite puede simplemente ignorarlo.
export async function notifyPatient(
  patientProfileId: string,
  push: { title: string; body: string; url?: string },
  sendEmail: () => Promise<void>,
): Promise<{ pushDelivered: boolean }> {
  const [pushDelivered] = await Promise.all([sendPushToPatient(patientProfileId, push), sendEmail()]);
  return { pushDelivered };
}
