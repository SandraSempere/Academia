import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/sign-out-button";
import { ChangePasswordForm } from "@/components/change-password-form";

const NAV_ITEMS = [
  { href: "/", label: "Inicio" },
  { href: "/academia", label: "Academia" },
  { href: "/sesiones", label: "Sesiones" },
  { href: "/progreso", label: "Mi progreso" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // La sesión (JWT) sigue siendo válida aunque la coach bloquee a la
  // paciente después de que haya iniciado sesión, o le reinicie la
  // contraseña — se comprueba aquí en cada carga para que afecte también a
  // una sesión ya abierta, no solo a logins nuevos (eso ya lo bloquea
  // `authorize()` en auth.ts).
  const patientState =
    session?.user?.role === "PATIENT"
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { blocked: true, mustChangePassword: true },
        })
      : null;

  if (patientState?.blocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-2xl">🔒</p>
        <h1 className="text-xl font-semibold">Acceso bloqueado</h1>
        <p className="max-w-sm text-sm text-foreground/70">
          Tu acceso a la Academia está bloqueado temporalmente. Escríbeme por
          WhatsApp si crees que es un error.
        </p>
        <SignOutButton />
      </div>
    );
  }

  // Contraseña provisional (alta nueva o reiniciada por la coach) — hay que
  // elegir una propia antes de poder usar el resto de la app. Una sola vez;
  // en cuanto cambian, `changePassword` quita este aviso.
  if (patientState?.mustChangePassword) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <div className="w-full max-w-sm rounded-2xl bg-blanco-roto p-8 text-center shadow-sm">
          <p className="text-2xl">🔑</p>
          <h1 className="mt-2 text-xl font-semibold">Elige tu contraseña</h1>
          <p className="mt-2 text-sm text-foreground/70">
            Por seguridad, antes de entrar tienes que cambiar la contraseña
            provisional por una tuya.
          </p>
          <div className="mt-6 text-left">
            <ChangePasswordForm />
          </div>
          <div className="mt-4">
            <SignOutButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-black/5 bg-blanco-roto">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Sandra Sempere" className="h-10 w-auto" />
          <nav className="flex items-center gap-5 text-sm">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-foreground/70 hover:text-brand-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-foreground/60">
              {session?.user?.name}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
