import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { CRM_ROLE_LABELS, getCrmUser } from "@/lib/crm";

// Cada visita comprueba el acceso contra la base de datos (miembro
// desactivado → fuera al instante), así que nada aquí puede quedar estático.
export const dynamic = "force-dynamic";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const user = await getCrmUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "COACH";
  const navItems = [
    { href: "/crm", label: "Inicio" },
    ...(isAdmin ? [{ href: "/crm/equipo", label: "Equipo CRM" }] : []),
    { href: "/crm/contrasena", label: "🔑 Contraseña" },
    ...(isAdmin ? [{ href: "/coach", label: "← Panel de pacientes" }] : []),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-black/5 bg-blanco-roto">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link href="/crm" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Sandra Sempere" className="h-10 w-auto" />
            <span className="text-sm text-foreground/60">CRM</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap text-sm text-foreground/70 hover:text-brand-primary"
              >
                {item.label}
              </Link>
            ))}
            <span className="whitespace-nowrap text-sm text-foreground/50">
              {user.name} · {CRM_ROLE_LABELS[user.role]}
            </span>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
