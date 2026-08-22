-- CreateTable
CREATE TABLE "CelebrationForm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT NOT NULL,
    "howWereYou" TEXT,
    "whatWorriedYou" TEXT,
    "whatChanged" TEXT,
    "whatCanYouDoNow" TEXT,
    "howWillYouCelebrate" TEXT,
    "submittedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CelebrationForm_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CelebrationForm_patientProfileId_key" ON "CelebrationForm"("patientProfileId");
