import { prisma } from "@/lib/prisma";
import { uploadResourceFile } from "@/app/coach/actions";

export const dynamic = "force-dynamic";

export default async function CoachRecursosPage() {
  const resources = await prisma.resource.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }],
  });

  const byCategory = new Map<string, typeof resources>();
  for (const resource of resources) {
    const list = byCategory.get(resource.category) ?? [];
    list.push(resource);
    byCategory.set(resource.category, list);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">📎 Recursos</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Sube el PDF de cada recurso directamente aquí. Se guarda en la app y
          tus pacientes lo verán al instante, sin depender de enlaces de
          Drive.
        </p>
      </div>

      {Array.from(byCategory.entries()).map(([category, items]) => (
        <div key={category} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-secondary">
            {category}
          </h2>
          <div className="flex flex-col gap-2">
            {items.map((resource) => (
              <div
                key={resource.id}
                className="flex flex-col gap-2 rounded-xl border border-black/5 bg-blanco-roto p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-brand-primary">
                    {resource.type}
                  </span>
                  <p className="font-medium">{resource.title}</p>
                  <p className="text-xs text-foreground/50">
                    {resource.url
                      ? resource.url.startsWith("/uploads/")
                        ? "✅ Archivo subido a la app"
                        : "🔗 Enlace externo"
                      : "⏳ Sin archivo todavía"}
                  </p>
                </div>
                <form
                  action={uploadResourceFile}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="resourceId" value={resource.id} />
                  <input
                    type="file"
                    name="file"
                    accept="application/pdf"
                    required
                    className="text-xs file:mr-2 file:rounded-full file:border-0 file:bg-brand-primary-soft file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-brand-primary"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-full bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                  >
                    {resource.url?.startsWith("/uploads/") ? "Reemplazar" : "Subir"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
