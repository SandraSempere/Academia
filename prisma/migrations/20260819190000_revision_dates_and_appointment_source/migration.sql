-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "source" TEXT;

-- AlterTable
ALTER TABLE "PatientProfile" ADD COLUMN "revision4Date" DATETIME;
ALTER TABLE "PatientProfile" ADD COLUMN "revision8Date" DATETIME;

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_patientProfileId_source_key" ON "Appointment"("patientProfileId", "source");
