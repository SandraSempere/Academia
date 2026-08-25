// Los 54 PDFs de "recursos" (guías, recetas...) van commiteados en
// content/recursos-seed en vez de directamente en public/uploads/recursos,
// porque en producción el volumen persistente de Railway se monta encima
// de public/uploads (para que la base de datos y los archivos que suba la
// coach sobrevivan a cada despliegue) — un volumen nuevo empieza vacío, así
// que tapaba también estos PDFs que van incluidos en el propio código,
// dejándolos en 404 la primera vez que arrancaba.
//
// Este script los copia a su sitio real (public/uploads/recursos, donde
// Next.js los sirve) — archivo por archivo, no todo o nada: si uno ya
// existe (siguientes arranques, o porque ya se copió antes), se salta; si
// falta (nunca se copió, o se cortó a medias por quedarse sin espacio en
// el volumen), se copia ahora. Así se autocompleta solo en el siguiente
// arranque en vez de quedarse a medias para siempre — que es justo lo que
// pasó la primera vez: el volumen se quedó sin espacio a mitad de copiar,
// y como antes solo se miraba "¿la carpeta ya tiene algo?", el resto de
// archivos nunca se llegó a copiar en los arranques siguientes.
//
// Si un archivo concreto falla (típicamente por falta de espacio), se
// avisa y se sigue con el resto — un PDF que no cabe no debe tumbar la
// app entera.
//
// Se llama tanto en "start" (producción) como en un nuevo "predev"
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

  const existing = new Set(readdirSync(TARGET_DIR));
  const files = readdirSync(SOURCE_DIR);
  const missing = files.filter((file) => !existing.has(file));

  if (missing.length === 0) {
    console.log(`Los ${files.length} PDFs de recursos ya están — no se vuelve a sembrar.`);
    return;
  }

  let copied = 0;
  for (const file of missing) {
    try {
      copyFileSync(path.join(SOURCE_DIR, file), path.join(TARGET_DIR, file));
      copied++;
    } catch (err) {
      console.error(`No se pudo copiar ${file} (se sigue con el resto):`, err);
    }
  }
  console.log(`Copiados ${copied}/${missing.length} PDFs de recursos que faltaban.`);
}

main();
