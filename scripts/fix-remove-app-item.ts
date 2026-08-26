// Cambio puntual (una sola vez): quita el paso "Cómo funciona la app" del
// bloque "🏁 Punto de partida" de la hoja de ruta. onDelete: Cascade en
// PatientChecklistItem se encarga de limpiar también las marcas de
// completado de las pacientes que ya lo hubieran tildado.
// Seguro de correr más de una vez: si el paso ya no existe, no encuentra
// nada que borrar y no hace nada.
import { prisma } from "../src/lib/prisma";

async function main() {
  const result = await prisma.weekBlockItemTemplate.deleteMany({
    where: { label: "Cómo funciona la app" },
  });
  console.log(`Eliminados ${result.count} paso(s) "Cómo funciona la app".`);
}

main().finally(() => prisma.$disconnect());
