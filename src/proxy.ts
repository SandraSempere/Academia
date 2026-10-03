import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { checkCrmAccess, isCrmTeamRole } from "@/lib/crm-access";

const { auth } = NextAuth(authConfig);

// Antes era src/middleware.ts (Next 16 lo renombra a proxy y lo ejecuta en
// Node.js, no en Edge) — eso permite consultar la base de datos aquí, que
// es lo que hace falta para cortar al instante el acceso de un miembro del
// CRM desactivado aunque su JWT siga siendo válido.

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

function clearSession(res: NextResponse) {
  for (const name of SESSION_COOKIES) res.cookies.delete(name);
  return res;
}

function forbidden(isApi: boolean) {
  if (isApi) {
    return NextResponse.json({ error: "No tienes acceso a este recurso." }, { status: 403 });
  }
  return new NextResponse(
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin acceso</title></head>` +
      `<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f5f1ea;color:#2f3a35;font-family:system-ui,sans-serif;text-align:center;padding:24px">` +
      `<div><p style="font-size:32px;margin:0">🔒</p><h1 style="font-size:20px">No tienes acceso a esta sección</h1>` +
      `<p style="font-size:14px;opacity:.7">Tu usuario solo tiene acceso al CRM.</p>` +
      `<a href="/crm" style="color:#e8a7a1;font-size:14px">Ir al CRM →</a></div></body></html>`,
    { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  // Ruta antigua de los archivos subidos: Next los serviría como estáticos
  // desde public/uploads sin ninguna comprobación. Se manda todo a
  // /api/files, que exige sesión y comprueba de quién es cada archivo.
  if (pathname.startsWith("/uploads/")) {
    return NextResponse.redirect(new URL(`/api/files/${pathname.slice("/uploads/".length)}`, req.nextUrl.origin));
  }

  const isApi = pathname.startsWith("/api/");
  const isAuthApi = pathname.startsWith("/api/auth/");
  const isAuthPage = pathname === "/login";
  // Rutas de "olvidé mi contraseña" (y la invitación al CRM, que reutiliza
  // el mismo enlace) — hay que poder entrar sin sesión.
  const isPasswordResetFlow =
    pathname === "/olvide-contrasena" || pathname.startsWith("/restablecer-contrasena/");
  const isCrmArea = pathname === "/crm" || pathname.startsWith("/crm/");
  const isCrmApi = pathname.startsWith("/api/crm/");
  const isCoachArea = pathname.startsWith("/coach");

  // Setter / closer: solo el CRM. Cualquier otra ruta o endpoint → 403.
  if (user && isCrmTeamRole(user.role)) {
    const access = await checkCrmAccess(user.id, user.sessionVersion ?? 0);
    if (!access) {
      // Desactivado o sesión invalidada: fuera, y se borra la cookie para
      // que /login no le devuelva al CRM con el JWT antiguo.
      if (isAuthApi) return NextResponse.next();
      if (isApi) return clearSession(NextResponse.json({ error: "Sesión no válida." }, { status: 401 }));
      if (isAuthPage || isPasswordResetFlow) return clearSession(NextResponse.next());
      return clearSession(NextResponse.redirect(new URL("/login", req.nextUrl.origin)));
    }

    if (isAuthPage || pathname === "/") {
      return NextResponse.redirect(new URL("/crm", req.nextUrl.origin));
    }
    // Equipo CRM es solo de la admin.
    if (pathname === "/crm/equipo" || pathname.startsWith("/crm/equipo/")) return forbidden(false);
    if (isCrmArea || isCrmApi || isAuthApi || isPasswordResetFlow || pathname === "/terminos-y-condiciones.pdf") {
      return NextResponse.next();
    }
    return forbidden(isApi);
  }

  // /api/crm/* solo para la admin (el equipo ya ha salido arriba).
  if (isCrmApi) {
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (user.role !== "COACH") return forbidden(true);
    return NextResponse.next();
  }

  // El resto de rutas /api/* se protegen a sí mismas (auth() o el secreto
  // de /api/cron/*) — no dependen de este proxy, que para el resto de roles
  // solo gobierna la navegación entre páginas. Redirigirlas a /login
  // bloquearía de raíz el cron externo de recordatorios (sin cookie de
  // sesión).
  if (isApi) return NextResponse.next();

  if (!user && !isAuthPage && !isPasswordResetFlow) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthPage) {
    const homeUrl = new URL(user.role === "COACH" ? "/coach" : "/", req.nextUrl.origin);
    return NextResponse.redirect(homeUrl);
  }

  if ((isCoachArea || isCrmArea) && user?.role !== "COACH") {
    const homeUrl = new URL("/", req.nextUrl.origin);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
});

// /api/* y /uploads/* entran enteros (incluidos archivos con extensión de
// imagen, p.ej. /api/files/...png) para que el proxy pueda dar 403 al
// equipo del CRM y redirigir /uploads; el último patrón deja fuera los
// estáticos de la propia app.
export const config = {
  matcher: [
    "/api/:path*",
    "/uploads/:path*",
    "/((?!api/|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw\.js|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
