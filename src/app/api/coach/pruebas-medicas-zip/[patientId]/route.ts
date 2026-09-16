import JSZip from "jszip";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ patientId: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "COACH") {
    return new Response("No autorizado", { status: 401 });
  }

  const { patientId } = await params;
  const patient = await prisma.user.findUnique({
    where: { id: patientId },
    include: { patientProfile: true },
  });
  if (!patient?.patientProfile) {
    return new Response("No encontrado", { status: 404 });
  }

  const tests = await prisma.medicalTest.findMany({
    where: { patientProfileId: patient.patientProfile.id },
    orderBy: { uploadedAt: "asc" },
  });
  if (tests.length === 0) {
    return new Response("No encontrado", { status: 404 });
  }

  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const [i, test] of tests.entries()) {
    // El nombre en disco es un id aleatorio (ver uploadMedicalTests); el
    // nombre original de la paciente vive en fileName — se usa ese para el
    // zip, con un número delante para que no choquen dos archivos con el
    // mismo nombre (p.ej. dos veces "IMG_1234.jpg").
    const diskFilename = path.basename(test.url);
    const filePath = path.join(UPLOADS_ROOT, "pruebas-medicas", diskFilename);
    const bytes = await readFile(filePath).catch(() => null);
    if (!bytes) continue; // un archivo suelto que falle no debe tumbar el resto

    let entryName = `${String(i + 1).padStart(2, "0")} - ${test.fileName}`;
    while (usedNames.has(entryName)) {
      entryName = `_${entryName}`;
    }
    usedNames.add(entryName);

    zip.file(entryName, bytes);
  }

  const zipBytes = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const filename = `pruebas-medicas-${slugify(patient.name ?? "paciente")}.zip`;

  return new Response(new Uint8Array(zipBytes), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
