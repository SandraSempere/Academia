import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

// Sustituye a servir estos archivos directamente desde public/uploads.
// En producción (Railway) el volumen persistente vive ahí, y el servidor de
// Next.js en producción calcula qué archivos hay bajo public/ al arrancar el
// proceso — un archivo subido DESPUÉS de ese arranque (por la coach o una
// paciente) queda en 404 para siempre hasta el próximo despliegue/reinicio,
// aunque esté perfectamente escrito en disco (confirmado: el archivo existe,
// con el tamaño correcto, pero la petición HTTP sigue dando 404 horas
// después). Esta ruta lee el archivo directamente en cada petición, así que
// siempre ve el estado real del disco, sin depender de cuándo arrancó el
// proceso.
//
// Son datos de salud (pruebas médicas, planes): hace falta sesión. La coach
// ve todo; una paciente solo los recursos (comunes a todas) y sus propios
// planes/pruebas — esos archivos se guardan como "<patientProfileId>-...".
// Setter/closer ni llegan aquí (403 en src/proxy.ts).
async function canAccess(segments: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, status: 401 };
  if (session.user.role === "COACH") return { ok: true as const };
  if (session.user.role !== "PATIENT") return { ok: false as const, status: 403 };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { blocked: true, patientProfile: { select: { id: true } } },
  });
  if (!user || user.blocked || !user.patientProfile) return { ok: false as const, status: 403 };

  const [folder, filename] = segments;
  if (segments.length === 2 && folder === "recursos") return { ok: true as const };
  if (
    segments.length === 2 &&
    (folder === "planes" || folder === "pruebas-medicas") &&
    filename.startsWith(`${user.patientProfile.id}-`)
  ) {
    return { ok: true as const };
  }
  return { ok: false as const, status: 403 };
}

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  if (segments.length === 0 || segments.some((s) => !s || s.includes("..") || s.includes("/") || s.includes("\\"))) {
    return new Response("No encontrado", { status: 404 });
  }

  const access = await canAccess(segments);
  if (!access.ok) {
    return new Response(access.status === 401 ? "Inicia sesión para ver este archivo." : "No tienes acceso a este archivo.", {
      status: access.status,
    });
  }

  const filePath = path.join(UPLOADS_ROOT, ...segments);
  if (!filePath.startsWith(UPLOADS_ROOT + path.sep)) {
    return new Response("No encontrado", { status: 404 });
  }

  const info = await stat(filePath).catch(() => null);
  if (!info || !info.isFile()) {
    return new Response("No encontrado", { status: 404 });
  }

  const buffer = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
