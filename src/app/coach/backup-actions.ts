"use server";

import { revalidatePath } from "next/cache";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadBackup, downloadBackup } from "@/lib/google-drive";
import { encryptBuffer, decryptBuffer } from "@/lib/backup-crypto";

async function requireCoach() {
  const session = await auth();
  if (!session?.user || session.user.role !== "COACH") {
    throw new Error("No autorizado");
  }
}

function dbFilePath() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const relative = url.replace(/^file:/, "");
  return path.join(process.cwd(), relative);
}

function timestamp() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

export async function runBackup(formData: FormData) {
  await requireCoach();

  const encrypted = formData.get("encrypted") === "on";
  const passphrase = String(formData.get("passphrase") ?? "");
  if (encrypted && passphrase.length < 6) {
    throw new Error("La contraseña de la copia cifrada debe tener al menos 6 caracteres.");
  }

  const dbBytes = await readFile(dbFilePath());
  const finalBytes = encrypted ? encryptBuffer(dbBytes, passphrase) : dbBytes;
  const filename = `copia-${timestamp()}${encrypted ? "-cifrada.enc" : ".db"}`;

  await uploadBackup(filename, finalBytes);

  revalidatePath("/coach/backup");
}

export async function restoreBackup(formData: FormData) {
  await requireCoach();

  const fileId = String(formData.get("fileId") ?? "");
  const passphrase = String(formData.get("passphrase") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const isEncrypted = String(formData.get("isEncrypted") ?? "") === "true";

  if (confirm !== "RESTAURAR") {
    throw new Error('Escribe "RESTAURAR" para confirmar — esta acción sustituye todos los datos actuales.');
  }
  if (isEncrypted && !passphrase) {
    throw new Error("Esta copia está cifrada, hace falta la contraseña.");
  }

  const downloaded = await downloadBackup(fileId);
  let dbBytes: Buffer;
  try {
    dbBytes = isEncrypted ? decryptBuffer(downloaded, passphrase) : downloaded;
  } catch {
    throw new Error("No se pudo descifrar la copia — revisa que la contraseña sea correcta.");
  }

  // Verificación mínima de que el archivo restaurado es una base de datos
  // SQLite real antes de sustituir la actual (evita dejar la app rota si la
  // contraseña era incorrecta y el "descifrado" solo dio bytes basura).
  const header = dbBytes.subarray(0, 16).toString("utf8");
  if (!header.startsWith("SQLite format 3")) {
    throw new Error("El archivo restaurado no es una copia válida (¿contraseña incorrecta?).");
  }

  await prisma.$disconnect();
  await writeFile(dbFilePath(), dbBytes);

  revalidatePath("/", "layout");
}

export async function disconnectBackup() {
  await requireCoach();
  await prisma.backupConfig.delete({ where: { id: "singleton" } }).catch(() => {});
  revalidatePath("/coach/backup");
}
