import { getCurrentPatientProfile } from "@/lib/patient";
import { prisma } from "@/lib/prisma";
import { MedicalTestUpload } from "@/components/medical-test-upload";

export const dynamic = "force-dynamic";

export default async function PruebasMedicasPage() {
  const profile = await getCurrentPatientProfile();
  const medicalTests = profile
    ? await prisma.medicalTest.findMany({
        where: { patientProfileId: profile.id },
        orderBy: { uploadedAt: "desc" },
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Adjunta aquí tus pruebas médicas</h1>
        <p className="mt-1 text-foreground/70">
          Súbelas en cuanto las tengas — así las tendré listas antes de tu
          consulta.
        </p>
      </div>

      <MedicalTestUpload tests={medicalTests} />
    </div>
  );
}
