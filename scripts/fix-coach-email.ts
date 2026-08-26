// Cambio puntual (una sola vez): la cuenta de coach se creó con un email
// de prueba (sandra@origendigestivo.local), así que "¿Olvidaste tu
// contraseña?" no podía funcionar de verdad — el enlace se mandaría a una
// dirección que no existe. La cambia a un email real de Sandra.
// Seguro de correr más de una vez: si el email de prueba ya no existe (ya
// se cambió), no encuentra nada que actualizar y no hace nada.
import { prisma } from "../src/lib/prisma";

async function main() {
  const result = await prisma.user.updateMany({
    where: { email: "sandra@origendigestivo.local", role: "COACH" },
    data: { email: "alimentacionbysandra@gmail.com" },
  });
  console.log(`Email de coach actualizado en ${result.count} cuenta(s).`);
}

main().finally(() => prisma.$disconnect());
