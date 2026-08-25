// Los 54 PDFs de "recursos" (guías, recetas...) van commiteados en
// content/recursos-seed en vez de directamente en public/uploads/recursos,
// porque en producción el volumen persistente de Railway se monta encima
// de public/uploads (para que la base de datos y los archivos que suba la
// coach sobrevivan a cada despliegue) — un volumen nuevo empieza vacío, así
// que tapaba también estos PDFs que van incluidos en el propio código,
// dejándolos en 404 la primera vez que arrancaba.
//
// Este script los copia una sola vez a su sitio real (public/uploads/
// recursos, donde Next.js los sirve) — si el destino ya tiene archivos
// (siguientes arranques, o alguno nuevo que suba la coach después), no
// toca nada. Se llama tanto en "start" (producción) como en "predev"
// (local), para que funcione igual en los dos sitios sin pasos manuales.
import { existsSync, mkdirSync, readdirSync, copyFileSync } from "node:fs";
import path from "node:path";

const SOURCE_DIR = path.join(process.cwd(), "content", "recursos-seed");
const TARGET_DIR = path.join(process.cwd(), "public", "uploads", "recursos");

function main() {
  if (!existsSync(SOURCE_DIR)) {
    console.log("No hay content/recursos-seed — nada que sembrar.");
    return;
  }

  mkdirSync(TARGET_DIR, { recursive: true });
  if (readdirSync(TARGET_DIR).length > 0) {
    console.log("public/uploads/recursos ya tiene archivos — no se vuelve a sembrar.");
    return;
  }

  const files = readdirSync(SOURCE_DIR);
  for (const file of files) {
    copyFileSync(path.join(SOURCE_DIR, file), path.join(TARGET_DIR, file));
  }
  console.log(`Copiados ${files.length} PDFs de recursos a public/uploads/recursos.`);
}

main();
