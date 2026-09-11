// Empaqueta la base de datos + los PDFs subidos por la coach (que viven en
// el volumen persistente y NO están en ningún otro sitio, a diferencia de
// los "recursos" precargados que sí van en el repo) en un único .zip para
// que la copia de seguridad los cubra a los dos. Antes la copia solo
// incluía dev.db — un despliegue con el volumen recién enganchado podía
// dejar sin PDFs a pacientes reales, sin ninguna copia de la que recuperarlos.
import JSZip from "jszip";
import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

// "recursos" queda fuera a propósito: esos PDFs ya están commiteados en
// content/recursos-seed y se restauran solos en cada arranque (ver
// scripts/seed-recursos.ts) — incluirlos aquí solo engordaría la copia.
const BACKED_UP_UPLOAD_DIRS = ["planes", "pruebas-medicas"];

async function addDirToZip(zip: JSZip, dirPath: string, zipPrefix: string) {
  let entries;
  try {
    entries = await readdir(dirPath, { withFileTypes: true });
  } catch {
    return; // la carpeta no existe todavía (nada subido aún) — no pasa nada
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      await addDirToZip(zip, path.join(dirPath, entry.name), `${zipPrefix}/${entry.name}`);
    } else {
      const bytes = await readFile(path.join(dirPath, entry.name));
      zip.file(`${zipPrefix}/${entry.name}`, bytes);
    }
  }
}

export async function buildBackupArchive(dbBytes: Buffer): Promise<Buffer> {
  const zip = new JSZip();
  zip.file("dev.db", dbBytes);
  for (const dir of BACKED_UP_UPLOAD_DIRS) {
    await addDirToZip(zip, path.join(process.cwd(), "public", "uploads", dir), `uploads/${dir}`);
  }
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

export function isZipBuffer(bytes: Buffer) {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

// Solo lee dev.db del zip, sin tocar nada en disco todavía — para poder
// validar que es una copia válida antes de sustituir los archivos reales
// (ver applyBackupArchive).
export async function loadBackupArchive(zipBytes: Buffer) {
  const zip = await JSZip.loadAsync(zipBytes);
  const dbEntry = zip.file("dev.db");
  if (!dbEntry) throw new Error("La copia no contiene la base de datos.");
  const dbBytes = await dbEntry.async("nodebuffer");
  return { zip, dbBytes };
}

// Sustituye el contenido actual de cada carpeta subida por el de la copia
// (borra primero lo que hay, igual que la restauración ya hace con la base
// de datos) — así "Restaurar" deja las cosas exactamente como estaban en
// ese momento, sin mezclar archivos subidos después de la copia.
export async function applyBackupArchive(zip: JSZip) {
  for (const dir of BACKED_UP_UPLOAD_DIRS) {
    const targetDir = path.join(process.cwd(), "public", "uploads", dir);
    await rm(targetDir, { recursive: true, force: true });
    await mkdir(targetDir, { recursive: true });
  }

  for (const entry of Object.values(zip.files)) {
    if (entry.dir || entry.name === "dev.db" || !entry.name.startsWith("uploads/")) continue;
    const relative = entry.name.slice("uploads/".length);
    const targetPath = path.join(process.cwd(), "public", "uploads", relative);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, await entry.async("nodebuffer"));
  }
}
