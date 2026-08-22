import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function OlvideContrasenaPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-brand-primary-soft/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-blanco-roto p-8 shadow-sm">
        <h1 className="text-xl font-semibold">¿Olvidaste tu contraseña?</h1>
        <p className="mt-2 text-sm text-foreground/70">
          Escribe el email con el que entras y te mandamos un enlace para
          elegir una nueva.
        </p>

        <div className="mt-6">
          <ForgotPasswordForm />
        </div>

        <Link href="/login" className="mt-4 inline-block text-sm text-foreground/60 hover:text-brand-primary">
          ← Volver a entrar
        </Link>
      </div>
    </div>
  );
}
