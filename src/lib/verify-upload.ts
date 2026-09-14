import { stat } from "node:fs/promises";

// El volumen persistente de Railway (donde vive /public/uploads en
// producción) ya se ha desenganchado alguna vez sin avisar (ver memoria del
// incidente de 404 del 2026-09-11) — writeFile no lanza ningún error en ese
// caso, así que sin esta comprobación se ve "subido" aunque el archivo no
// esté realmente en disco, y nadie se entera hasta que alguien intenta
// abrirlo. Mejor un error claro aquí y ahora que un 404 silencioso después.
export async function verifyWrittenFile(filePath: string, expectedSize: number) {
  const info = await stat(filePath).catch(() => null);
  if (!info || info.size !== expectedSize) {
    throw new Error(
      "El archivo no se guardó correctamente en el servidor (posible problema de almacenamiento). Inténtalo de nuevo en un minuto; si sigue fallando, avisa a Jordi.",
    );
  }
}
