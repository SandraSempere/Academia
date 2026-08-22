import { prisma } from "@/lib/prisma";
import { listBackups } from "@/lib/google-drive";
import { runBackup, restoreBackup, disconnectBackup } from "@/app/coach/backup-actions";

export default async function BackupPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { connected, error } = await searchParams;
  const config = await prisma.backupConfig.findUnique({ where: { id: "singleton" } });

  if (!config) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">💾 Copia de seguridad</h1>
        {error && (
          <p className="rounded-lg bg-brand-primary-soft px-4 py-3 text-sm">
            No se pudo conectar con Google Drive. Inténtalo de nuevo.
          </p>
        )}
        <div className="rounded-2xl border border-black/5 bg-blanco-roto p-6">
          <p className="text-sm text-foreground/70">
            Conecta tu cuenta de Google Drive para poder hacer copias de
            seguridad de los datos de tus pacientes y restaurarlas si algún
            día lo necesitas.
          </p>
          <a
            href="/api/backup/connect"
            className="mt-4 inline-block rounded-full bg-brand-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Conectar con Google Drive
          </a>
        </div>
      </div>
    );
  }

  let backups: Awaited<ReturnType<typeof listBackups>> = [];
  let listError: string | null = null;
  try {
    backups = await listBackups();
  } catch {
    listError = "No se pudieron cargar las copias guardadas en Drive.";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">💾 Copia de seguridad</h1>
        <form action={disconnectBackup}>
          <button type="submit" className="text-xs text-foreground/50 hover:text-brand-primary">
            Desconectar Google Drive
          </button>
        </form>
      </div>

      {connected && (
        <p className="rounded-lg bg-brand-tertiary-soft px-4 py-3 text-sm">
          Google Drive conectado correctamente.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <form action={runBackup} className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-blanco-roto p-5">
          <p className="font-semibold">⚡ Copia rápida</p>
          <p className="text-sm text-foreground/70">
            Guarda ahora mismo una copia de todos los datos en tu Google
            Drive, sin contraseña.
          </p>
          <button
            type="submit"
            className="self-start rounded-full bg-brand-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Hacer copia rápida
          </button>
        </form>

        <form action={runBackup} className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-blanco-roto p-5">
          <input type="hidden" name="encrypted" value="on" />
          <p className="font-semibold">🔒 Copia cifrada</p>
          <p className="text-sm text-foreground/70">
            Igual que la copia rápida, pero protegida con una contraseña que
            eliges tú. Sin ella no se puede restaurar.
          </p>
          <label className="flex flex-col gap-1 text-sm">
            Contraseña de la copia
            <input
              name="passphrase"
              type="password"
              required
              minLength={6}
              className="rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-primary"
            />
          </label>
          <button
            type="submit"
            className="self-start rounded-full bg-brand-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Hacer copia cifrada
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <p className="font-semibold">Copias guardadas</p>
        {listError && <p className="mt-2 text-sm text-foreground/60">{listError}</p>}
        {!listError && backups.length === 0 && (
          <p className="mt-2 text-sm text-foreground/60">Todavía no has hecho ninguna copia.</p>
        )}
        <div className="mt-3 flex flex-col gap-2">
          {backups.map((backup) => {
            const isEncrypted = backup.name.endsWith(".enc");
            return (
              <details key={backup.id} className="rounded-lg border border-black/5 px-3 py-2 text-sm">
                <summary className="cursor-pointer">
                  {isEncrypted ? "🔒" : "⚡"} {backup.name}{" "}
                  <span className="text-foreground/50">
                    · {new Date(backup.createdTime).toLocaleString("es-ES")}
                  </span>
                </summary>
                <form action={restoreBackup} className="mt-3 flex flex-col gap-2">
                  <input type="hidden" name="fileId" value={backup.id} />
                  <input type="hidden" name="isEncrypted" value={String(isEncrypted)} />
                  <p className="text-xs text-foreground/60">
                    Esto sustituye TODOS los datos actuales por los de esta
                    copia. No se puede deshacer.
                  </p>
                  {isEncrypted && (
                    <label className="flex flex-col gap-1 text-xs">
                      Contraseña de la copia
                      <input
                        name="passphrase"
                        type="password"
                        required
                        className="rounded-lg border border-black/10 px-3 py-1.5 outline-none focus:border-brand-primary"
                      />
                    </label>
                  )}
                  <label className="flex flex-col gap-1 text-xs">
                    Escribe RESTAURAR para confirmar
                    <input
                      name="confirm"
                      type="text"
                      required
                      placeholder="RESTAURAR"
                      className="rounded-lg border border-black/10 px-3 py-1.5 outline-none focus:border-brand-primary"
                    />
                  </label>
                  <button
                    type="submit"
                    className="self-start rounded-full bg-brand-primary px-4 py-1.5 text-xs font-medium text-white hover:opacity-90"
                  >
                    Restaurar esta copia
                  </button>
                </form>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
}
