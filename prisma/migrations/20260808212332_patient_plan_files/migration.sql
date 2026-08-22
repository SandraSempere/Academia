-- CreateTable
CREATE TABLE "PatientPlanFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "url" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PatientPlanFile_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientPlanFile_patientProfileId_category_slot_key" ON "PatientPlanFile"("patientProfileId", "category", "slot");
