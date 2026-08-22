import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-black/5 bg-blanco-roto">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/coach" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Sandra Sempere" className="h-10 w-auto" />
            <span className="text-sm text-foreground/60">Panel</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/coach/pacientes" className="text-sm text-foreground/70 hover:text-brand-primary">
              Pacientes
            </Link>
            <Link href="/coach/agenda" className="text-sm text-foreground/70 hover:text-brand-primary">
              Agenda
            </Link>
            <Link href="/coach/revisiones" className="text-sm text-foreground/70 hover:text-brand-primary">
              Revisiones
            </Link>
            <Link href="/coach/recursos" className="text-sm text-foreground/70 hover:text-brand-primary">
              Recursos
            </Link>
            <Link href="/coach/backup" className="text-sm text-foreground/70 hover:text-brand-primary">
              Copia de seguridad
            </Link>
            <Link href="/cambiar-contrasena" className="text-sm text-foreground/70 hover:text-brand-primary">
              🔑 Contraseña
            </Link>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
