-- CreateTable
CREATE TABLE "ClosingForm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT NOT NULL,
    "name" TEXT,
    "howArrived" TEXT,
    "howNow" TEXT,
    "whatChanged" TEXT,
    "whatUnderstood" TEXT,
    "whatStoppedConditioning" TEXT,
    "mostUseful" TEXT,
    "whatWouldYouSay" TEXT,
    "testimonialConsent" TEXT,
    "submittedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClosingForm_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ClosingForm_patientProfileId_key" ON "ClosingForm"("patientProfileId");
