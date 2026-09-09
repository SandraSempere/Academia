"use client";

import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { checkTermsRequired } from "@/app/actions";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  // Por defecto se pide la casilla (opción segura) hasta que sepamos, al
  // salir del campo de email, que esa cuenta ya la aceptó antes — entonces
  // se deja de mostrar y de exigirla.
  const [termsRequired, setTermsRequired] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailBlur() {
    const required = await checkTermsRequired(email);
    setTermsRequired(required);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setLoading(false);
      setError("Email o contraseña incorrectos.");
      return;
    }

    const session = await getSession();
    router.push(session?.user?.role === "COACH" ? "/coach" : "/");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-brand-primary-soft/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-blanco-roto p-8 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Sandra Sempere · Dietista Integrativa" className="h-20 w-auto" />
        <p className="mt-3 text-sm text-foreground/70">
          Entra para ver tu espacio de acompañamiento.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleEmailBlur}
              className="rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-primary"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Contraseña
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-primary"
            />
          </label>

          {termsRequired && (
            <label className="flex items-start gap-2 text-sm text-foreground/80">
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand-primary"
              />
              <span>
                He leído y acepto los{" "}
                <a
                  href="/terminos-y-condiciones.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-brand-primary"
                >
                  términos y condiciones de uso
                </a>{" "}
                de la APLICACIÓN.
              </span>
            </label>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-brand-primary px-4 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <Link
            href="/olvide-contrasena"
            className="text-center text-sm text-foreground/60 hover:text-brand-primary"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </form>
      </div>
    </div>
  );
}
