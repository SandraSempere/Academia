import { ChangePasswordForm } from "@/components/change-password-form";

export default function CrmContrasenaPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">🔑 Cambiar contraseña</h1>
      <div className="rounded-2xl bg-blanco-roto p-6 shadow-sm">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
