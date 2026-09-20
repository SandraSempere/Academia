import { prisma } from "@/lib/prisma";
import { DIGEST_PLAN_FILE_CATEGORIES, PLAN_FILE_CATEGORY_INFO } from "@/lib/plan-file-categories";
import { sendPlanFilesDigestEmail } from "@/lib/email";

const DEBOUNCE_MS = 5 * 60 * 1000;

// Comprobación frecuente (cada 5 minutos, ver cron de Railway): junta en un
// único email todos los documentos de plan (plan de acción, nutricional,
// suplementación, analítica, recetas) que la coach haya subido y que
// llevan al menos `DEBOUNCE_MS` sin ningún cambio nuevo — así, si sube
// varios documentos seguidos para la misma paciente, le llega un solo
// email en vez de uno por archivo. El push de cada documento ya se manda
// al momento desde uploadPatientPlanFile (no aquí) — esto es solo el email.
//
// Mismo CRON_SECRET que el resto de crons de /api/cron.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = new URL(request.url).searchParams.get("secret");
    if (provided !== secret) {
      return new Response("No autorizado", { status: 401 });
    }
  }

  const cutoff = new Date(Date.now() - DEBOUNCE_MS);

  const pendingFiles = await prisma.patientPlanFile.findMany({
    where: {
      category: { in: DIGEST_PLAN_FILE_CATEGORIES },
      pendingEmailAt: { not: null, lte: cutoff },
    },
    include: { patientProfile: { include: { user: true } } },
  });

  const groups = new Map<string, typeof pendingFiles>();
  for (const file of pendingFiles) {
    const key = `${file.patientProfileId}:${file.cycle}`;
    const list = groups.get(key) ?? [];
    list.push(file);
    groups.set(key, list);
  }

  let emailsSent = 0;

  for (const files of groups.values()) {
    const { patientProfile } = files[0];
    const categories = [...new Set(files.map((f) => f.category))];
    const items = DIGEST_PLAN_FILE_CATEGORIES.filter((c) => categories.includes(c)).map(
      (c) => PLAN_FILE_CATEGORY_INFO[c].digestLine,
    );

    await sendPlanFilesDigestEmail(patientProfile.user.email, patientProfile.user.name ?? "", items, patientProfile.id);
    await prisma.patientPlanFile.updateMany({
      where: { id: { in: files.map((f) => f.id) } },
      data: { pendingEmailAt: null },
    });
    emailsSent++;
  }

  return Response.json({ checked: pendingFiles.length, emailsSent });
}
