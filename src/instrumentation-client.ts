// Mitad "navegador" del aviso proactivo de errores — ver src/instrumentation.ts
// para la mitad de servidor. Captura errores de JavaScript que pasan en el
// móvil/ordenador de una paciente o de la coach, no solo los del servidor.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
