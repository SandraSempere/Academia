import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/change-password-form";

// Solo la coach — las pacientes cambian la suya la primera vez que entran
// (contraseña provisional obligatoria, ver (app)/layout.tsx) y, si la
// olvidan después, usan "¿Olvidaste tu contraseña?" desde el login.
export default async function CambiarContrasenaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "COACH") redirect("/");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/coach" className="text-sm text-foreground/60 hover:text-brand-primary">
          ← Volver
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">🔑 Cambiar contraseña</h1>
      </div>

      <ChangePasswordForm />
    </div>
  );
}
