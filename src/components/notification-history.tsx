type NotificationLogRow = {
  id: string;
  channel: string;
  category: string;
  title: string;
  status: string;
  createdAt: Date;
  openedAt: Date | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  plan_file_upload: "📎 Documento de plan",
  plan_file_digest: "📬 Email combinado de plan",
  plan_file_reintroduccion: "🔓 Documento de reintroducción",
  appointment_reminder: "📅 Recordatorio de cita",
  quincenal_reminder: "📋 Recordatorio de formulario",
  quincenal_video: "🎥 Vídeo de revisión",
  welcome: "🌿 Bienvenida",
  test_push: "🔔 Prueba manual",
};

const PUSH_STATUS: Record<string, { label: string; className: string }> = {
  delivered: { label: "✅ Entregado", className: "bg-brand-tertiary-soft" },
  no_subscription: { label: "⚠️ Sin suscripción", className: "bg-brand-primary-soft" },
  failed: { label: "❌ Error", className: "bg-brand-primary-soft" },
};

// El email no tiene forma de saber "entregado"/"abierto" al momento de
// mandarlo — esos dos solo llegan más tarde por el webhook de Resend (ver
// /api/webhooks/resend), si está configurado. Hasta que llega ese evento
// (o si nunca se configura), se queda en "enviado".
const EMAIL_STATUS: Record<string, { label: string; className: string }> = {
  sent: { label: "📤 Enviado", className: "bg-blanco-roto border border-black/10" },
  delivered: { label: "✅ Entregado", className: "bg-brand-tertiary-soft" },
  opened: { label: "👁️ Abierto", className: "bg-brand-tertiary-soft" },
  bounced: { label: "⚠️ Rebotado", className: "bg-brand-primary-soft" },
  complained: { label: "🚫 Marcado como spam", className: "bg-brand-primary-soft" },
  failed: { label: "❌ Error", className: "bg-brand-primary-soft" },
};

function StatusBadge({ channel, status }: { channel: string; status: string }) {
  const info = (channel === "push" ? PUSH_STATUS : EMAIL_STATUS)[status] ?? { label: status, className: "" };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${info.className}`}>{info.label}</span>;
}

export function NotificationHistory({ logs }: { logs: NotificationLogRow[] }) {
  if (logs.length === 0) {
    return <p className="mt-3 text-sm text-foreground/60">Todavía no se le ha mandado ningún aviso.</p>;
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {logs.map((log) => (
        <div key={log.id} className="flex items-center justify-between gap-3 rounded-lg bg-crema p-3 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium">{CATEGORY_LABELS[log.category] ?? log.category}</p>
            <p className="truncate text-xs text-foreground/50">
              {log.channel === "push" ? "📱 Push" : "📧 Email"} · {log.title} ·{" "}
              {log.createdAt.toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              {log.openedAt && (
                <> · abierto {log.openedAt.toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</>
              )}
            </p>
          </div>
          <StatusBadge channel={log.channel} status={log.status} />
        </div>
      ))}
    </div>
  );
}
