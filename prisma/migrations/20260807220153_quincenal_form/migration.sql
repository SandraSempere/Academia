-- CreateTable
CREATE TABLE "QuincenalForm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "submittedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuincenalForm_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "QuincenalForm_patientProfileId_week_key" ON "QuincenalForm"("patientProfileId", "week");
