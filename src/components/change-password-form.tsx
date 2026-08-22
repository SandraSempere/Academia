"use client";

import { useRef, useState, useTransition } from "react";
import { changePassword } from "@/app/actions";

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          setError(null);
          setSaved(false);
          try {
            await changePassword(formData);
            setSaved(true);
            formRef.current?.reset();
          } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña.");
          }
        })
      }
      className="flex max-w-sm flex-col gap-4"
    >
      {saved && (
        <p className="rounded-lg bg-brand-tertiary-soft px-4 py-3 text-sm">
          🌿 Contraseña actualizada correctamente.
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-brand-primary-soft px-4 py-3 text-sm text-brand-primary">
          {error}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Contraseña actual
        <input
          name="currentPassword"
          type="password"
          required
          className="rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-primary"
        />
      </label>

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
        {pending ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}
