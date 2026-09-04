// Cambio puntual (una sola vez): el seed solo siembra si la base de datos
// está vacía, así que esta lección ya existía tal cual antes del cambio de
// copy — se actualiza aquí directamente. Seguro de correr más de una vez:
// si el título viejo ya no existe (ya se actualizó), no encuentra nada y
// no hace nada.
import { prisma } from "../src/lib/prisma";

const OLD_TITLE = "Tus asistentes · Guía rápida";
const NEW_TITLE = "Tu asistente · Guía rápida";
const NEW_BODY =
  "Además de mí, vas a tener tu Asistente Origen Digestivo, entrenado con mi forma de trabajar.\n\n¿Para qué lo puedes usar?\n▪ Saber si un alimento te puede sentar bien según tu fase\n▪ Dudas rápidas del día a día\n▪ Recomendaciones de marcas y productos\n▪ Ideas de recetas\n\nPara qué NO es:\nTu asistente resuelve el día a día. Si tienes una duda que te preocupa de verdad, escríbeme por WhatsApp.\n\nNecesitas una cuenta gratuita de ChatGPT para usarlo.\n\n[Asistente Digestivo](https://chatgpt.com/g/g-6a520c55f4048191b8c40ffad2fcba43-sandra-asistente-digestivo)";

async function main() {
  const result = await prisma.lesson.updateMany({
    where: { title: OLD_TITLE },
    data: { title: NEW_TITLE, body: NEW_BODY },
  });
  console.log(`Actualizada(s) ${result.count} lección(es) "Tus asistentes" -> "Tu asistente".`);
}

main().finally(() => prisma.$disconnect());
