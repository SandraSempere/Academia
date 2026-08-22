import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const dynamic = "force-dynamic";

export default async function RestablecerContrasenaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  const valid = !!resetToken && !resetToken.usedAt && resetToken.expiresAt > new Date();

  return (
    <div className="flex flex-1 items-center justify-center bg-brand-primary-soft/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-blanco-roto p-8 shadow-sm">
        <h1 className="text-xl font-semibold">Elige tu contraseña nueva</h1>

        {valid ? (
          <div className="mt-6">
            <ResetPasswordForm token={token} />
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-sm text-foreground/70">
              Este enlace no es válido o ya ha caducado.
            </p>
            <Link href="/olvide-contrasena" className="text-sm text-brand-primary hover:opacity-80">
              Pedir uno nuevo →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
