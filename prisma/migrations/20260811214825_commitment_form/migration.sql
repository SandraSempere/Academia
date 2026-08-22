-- CreateTable
CREATE TABLE "CommitmentForm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT NOT NULL,
    "attempt1What" TEXT,
    "attempt1When" TEXT,
    "attempt1HowItWent" TEXT,
    "attempt2What" TEXT,
    "attempt2When" TEXT,
    "attempt2HowItWent" TEXT,
    "attempt3What" TEXT,
    "attempt3When" TEXT,
    "attempt3HowItWent" TEXT,
    "attempt4What" TEXT,
    "attempt4When" TEXT,
    "attempt4HowItWent" TEXT,
    "attempt5What" TEXT,
    "attempt5When" TEXT,
    "attempt5HowItWent" TEXT,
    "attempt6What" TEXT,
    "attempt6When" TEXT,
    "attempt6HowItWent" TEXT,
    "letter" TEXT,
    "submittedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommitmentForm_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CommitmentForm_patientProfileId_key" ON "CommitmentForm"("patientProfileId");
