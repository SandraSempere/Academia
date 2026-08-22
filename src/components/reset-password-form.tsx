"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordWithToken } from "@/app/actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-lg bg-brand-tertiary-soft px-4 py-3 text-sm">
          🌿 Contraseña actualizada. Ya puedes entrar con ella.
        </p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="self-start rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Ir a entrar
        </button>
      </div>
    );
  }

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          setError(null);
          formData.set("token", token);
          try {
            await resetPasswordWithToken(formData);
            setDone(true);
          } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña.");
          }
        })
      }
      className="flex flex-col gap-4"
    >
      {error && (
        <p className="rounded-lg bg-brand-primary-soft px-4 py-3 text-sm text-brand-primary">
          {error}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Contraseña nueva
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          placeholder="Mínimo 8 caracteres"
          className="rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-primary"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Repite la contraseña nueva
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-primary"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Elegir esta contraseña"}
      </button>
    </form>
  );
}
