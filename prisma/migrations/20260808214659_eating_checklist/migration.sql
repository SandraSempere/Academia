-- CreateTable
CREATE TABLE "EatingChecklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT NOT NULL,
    "step1" BOOLEAN NOT NULL DEFAULT false,
    "step2" BOOLEAN NOT NULL DEFAULT false,
    "step3" BOOLEAN NOT NULL DEFAULT false,
    "step4" BOOLEAN NOT NULL DEFAULT false,
    "step5" BOOLEAN NOT NULL DEFAULT false,
    "monday" TEXT,
    "tuesday" TEXT,
    "wednesday" TEXT,
    "thursday" TEXT,
    "friday" TEXT,
    "saturday" TEXT,
    "sunday" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EatingChecklist_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EatingChecklist_patientProfileId_key" ON "EatingChecklist"("patientProfileId");
