// Notificaciones push del navegador (Web Push) — igual que email.ts, nunca
// lanza si falla el envío, para no romper el flujo que lo dispara (el cron
// de recordatorios, en este caso).
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:academia@sandrasempere.com";

if (PUBLIC_KEY && PRIVATE_KEY) {
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
}

export async function sendPushToPatient(
  patientProfileId: string,
  payload: { title: string; body: string; url?: string },
) {
  if (!PUBLIC_KEY || !PRIVATE_KEY) {
    console.warn("VAPID no configurado — no se manda la notificación push.");
    return;
  }

  const subscriptions = await prisma.pushSubscription.findMany({ where: { patientProfileId } });
  const body = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, body);
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
}
