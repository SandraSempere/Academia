// Aviso proactivo de errores (Sentry) — solo en el servidor (Node), no en
// el runtime "edge" (el middleware, que ya se protege solo con sus propios
// try/catch). Si no hay SENTRY_DSN configurado (p.ej. en local), Sentry.init
// simplemente no manda nada — no hace falta ningún guard aparte.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      // Solo captura de errores, sin trazas de rendimiento — es lo único
      // que hace falta para "avísame cuando algo falle de verdad", y así
      // no gasta la cuota gratuita en algo que no se va a mirar.
      tracesSampleRate: 0,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
