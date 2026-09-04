// Notificaciones push del navegador (Web Push) — igual que email.ts, nunca
// lanza si falla el envío, para no romper el flujo que lo dispara.
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:academia@sandrasempere.com";

if (PUBLIC_KEY && PRIVATE_KEY) {
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
}

// Devuelve si se ha entregado al menos a una suscripción — lo usa
// notify.ts para decidir si hace falta el email de respaldo. "Entregado"
// aquí significa que el servicio de push (FCM/APNs...) la aceptó, que es
// lo máximo que se puede saber desde el servidor — Web Push no avisa si
// el móvil llegó a mostrarla de verdad.
export async function sendPushToPatient(
  patientProfileId: string,
  payload: { title: string; body: string; url?: string },
): Promise<boolean> {
  if (!PUBLIC_KEY || !PRIVATE_KEY) {
    console.warn("VAPID no configurado — no se manda la notificación push.");
    return false;
  }

  const subscriptions = await prisma.pushSubscription.findMany({ where: { patientProfileId } });
  if (subscriptions.length === 0) return false;

  const body = JSON.stringify(payload);
  let delivered = false;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, body);
        delivered = true;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Suscripción caducada o revocada (desinstaló la app, borró
          // datos del navegador...) — se limpia sola, no hace falta que
          // nadie la borre a mano.
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error("Error enviando notificación push:", err);
        }
      }
    }),
  );

  return delivered;
}
