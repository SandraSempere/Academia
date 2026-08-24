import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  const isAuthPage = pathname === "/login";
  // Rutas de "olvidé mi contraseña" — hay que poder entrar sin sesión
  // (si pudieras entrar ya no habrías olvidado nada).
  const isPasswordResetFlow =
    pathname === "/olvide-contrasena" || pathname.startsWith("/restablecer-contrasena/");
  const isCoachArea = pathname.startsWith("/coach");

  if (!user && !isAuthPage && !isPasswordResetFlow) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthPage) {
    const homeUrl = new URL(user.role === "COACH" ? "/coach" : "/", req.nextUrl.origin);
    return NextResponse.redirect(homeUrl);
  }

  if (isCoachArea && user?.role !== "COACH") {
    const homeUrl = new URL("/", req.nextUrl.origin);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
});

// Todas las rutas /api/* se protegen a sí mismas (auth() o el secreto de
// /api/cron/*) — no dependen de este middleware, que solo debe gobernar la
// navegación entre páginas. Dejarlas pasar por aquí bloqueaba de raíz el
// cron externo de recordatorios: sin cookie de sesión, cualquier petición
// (incluido un cron sin navegador) se redirigía a /login en vez de llegar
// a la ruta.
export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
