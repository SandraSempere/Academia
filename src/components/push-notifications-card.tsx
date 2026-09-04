"use client";

import { useEffect, useState } from "react";
import { savePushSubscription } from "@/app/(app)/actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type Status = "checking" | "unsupported" | "subscribed" | "unsubscribed" | "denied";

export function PushNotificationsCard() {
  const [status, setStatus] = useState<Status>("checking");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const existing = await registration.pushManager.getSubscription();
        if (!cancelled) setStatus(existing ? "subscribed" : "unsubscribed");
      } catch {
        if (!cancelled) setStatus("unsupported");
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  async function activar() {
    setPending(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("no configurado");

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("suscripción incompleta");

      await savePushSubscription({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
      setStatus("subscribed");
    } catch {
      setError("No se pudo activar. Inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  }

  // Una vez activadas, la tarjeta desaparece de Inicio — no hace falta
  // seguir recordándoselo cada vez que entra. Si alguna vez quiere
  // desactivarlas, puede hacerlo desde los ajustes de notificaciones de su
  // propio móvil/navegador (mismo camino que para bloquearlas).
  if (status === "checking" || status === "unsupported" || status === "subscribed") return null;

  return (
    <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
      <p className="font-medium">🔔 Notificaciones</p>

      {status === "unsubscribed" && (
        <>
          <p className="mt-1 text-sm text-foreground/70">
            Actívalas para que te avise el móvil cuando te toque rellenar un
            formulario, te suba tu plan nutricional o te deje un vídeo de tu
            revisión. En iPhone, primero tienes que haber instalado la app
            en la pantalla de inicio.
          </p>
          <button
            type="button"
            onClick={activar}
            disabled={pending}
            className="mt-3 rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Activando..." : "Activar notificaciones"}
          </button>
        </>
      )}

      {status === "denied" && (
        <p className="mt-1 text-sm text-foreground/70">
          Tienes las notificaciones bloqueadas para esta app en tu
          navegador o móvil. Actívalas desde los ajustes de notificaciones
          de tu dispositivo si quieres recibirlas.
        </p>
      )}

      {error && <p className="mt-2 text-xs text-brand-primary">{error}</p>}
    </div>
  );
}
