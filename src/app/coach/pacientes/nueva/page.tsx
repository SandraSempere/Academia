import { createPatient } from "@/app/coach/actions";

export default function NuevaPacientePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nueva paciente</h1>

      <form action={createPatient} className="flex max-w-md flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input
            name="name"
            required
            className="rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-primary"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-primary"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Contraseña provisional
          <input
            name="password"
            type="text"
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
            className="rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-primary"
          />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-full bg-brand-primary px-4 py-2 font-medium text-white hover:opacity-90"
        >
          Crear paciente
        </button>
      </form>
    </div>
  );
}
