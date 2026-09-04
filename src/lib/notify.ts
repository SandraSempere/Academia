// Punto único para avisar a una paciente de algo (recordatorio de
// formulario, plan nutricional nuevo, vídeo de respuesta...): intenta
// primero la notificación push y, solo si no se pudo entregar a ningún
// dispositivo (no está suscrita, o todas sus suscripciones habían
// caducado), manda el email de respaldo — nunca los dos a la vez.
import { sendPushToPatient } from "@/lib/push";

export async function notifyPatient(
  patientProfileId: string,
  push: { title: string; body: string; url?: string },
  sendEmailFallback: () => Promise<void>,
) {
  const delivered = await sendPushToPatient(patientProfileId, push);
  if (!delivered) {
    await sendEmailFallback();
  }
}
