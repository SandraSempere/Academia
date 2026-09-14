// Migración puntual: las URLs de archivos subidos (planes, recursos, pruebas
// médicas) que guardaba la base de datos apuntaban a /uploads/..., servido
// directamente por Next.js desde public/uploads. Se ha comprobado que el
// servidor de producción calcula qué archivos hay ahí al arrancar el
// proceso y no ve los que se añaden después mientras sigue corriendo —
// cualquier archivo subido tras el último arranque quedaba en 404 para
// siempre aunque estuviera perfectamente escrito en disco (ver
// src/app/api/files/[...path]/route.ts, que lo sustituye leyendo el disco
// en cada petición). Los archivos en sí no se mueven ni se tocan, solo el
// prefijo que la app usa para pedirlos.
//
// Seguro de correr en cada arranque: una vez migradas, no queda ninguna fila
// con /uploads/... y no hace nada en los arranques siguientes.
import { prisma } from "../src/lib/prisma";

async function main() {
  const [planFiles, resources, medicalTests] = await Promise.all([
    prisma.$executeRaw`UPDATE PatientPlanFile SET url = replace(url, '/uploads/', '/api/files/') WHERE url LIKE '/uploads/%'`,
    prisma.$executeRaw`UPDATE Resource SET url = replace(url, '/uploads/', '/api/files/') WHERE url LIKE '/uploads/%'`,
    prisma.$executeRaw`UPDATE MedicalTest SET url = replace(url, '/uploads/', '/api/files/') WHERE url LIKE '/uploads/%'`,
  ]);
  console.log(
    `Migradas URLs de /uploads/ a /api/files/: ${planFiles} plan(es), ${resources} recurso(s), ${medicalTests} prueba(s) médica(s).`,
  );
}

main().finally(() => prisma.$disconnect());
