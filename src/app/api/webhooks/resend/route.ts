import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

// Resend manda aquí los eventos de cada email que sale de la app
// (entregado, abierto, rebotado, marcado como spam...) — es lo que permite
// que el historial de avisos en /coach/pacientes/[id] sepa si de verdad
// llegó, no solo si Resend lo aceptó al mandarlo (eso ya se sabe al
// momento, en src/lib/email.ts). La firma se verifica con svix (la misma
// librería que usa Resend por debajo) y el secreto que da Resend al crear
// el webhook en su panel — ver RESEND_WEBHOOK_SECRET en .env.example.
//
// Eventos que hace falta activar al crear el webhook en Resend:
// email.delivered, email.opened, email.bounced, email.complained.
const STATUS_BY_EVENT: Record<string, string> = {
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.bounced": "bounced",
  "email.complained": "complained",
};

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("RESEND_WEBHOOK_SECRET no configurado — webhook de Resend ignorado.");
    return new Response("No configurado", { status: 501 });
  }

  const payload = await request.text();
  const svixHeaders = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  try {
    // `.verify()` en esta versión de svix no devuelve el payload parseado
    // (ni el tipo ni el comportamiento real lo hacen, comprobado) — solo
    // lanza si la firma no es válida. El JSON hay que parsearlo aparte,
    // del mismo `payload` ya verificado.
    new Webhook(secret).verify(payload, svixHeaders);
  } catch (err) {
    console.error("Firma de webhook de Resend inválida:", err);
    return new Response("Firma inválida", { status: 401 });
  }

  const event = JSON.parse(payload) as { type: string; data: { email_id?: string } };

  const resendId = event.data.email_id;
  const status = STATUS_BY_EVENT[event.type];
  if (!resendId || !status) return Response.json({ ok: true });

  await prisma.notificationLog
    .updateMany({
      where: { resendId },
      data: { status, ...(status === "opened" ? { openedAt: new Date() } : {}) },
    })
    .catch(() => {});

  return Response.json({ ok: true });
}
