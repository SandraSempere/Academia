import { readFile, stat } from "node:fs/promises";
import path from "node:path";

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
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  if (segments.length === 0 || segments.some((s) => !s || s.includes("..") || s.includes("/") || s.includes("\\"))) {
    return new Response("No encontrado", { status: 404 });
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
