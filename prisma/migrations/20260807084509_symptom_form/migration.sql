-- CreateTable
CREATE TABLE "SymptomForm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT NOT NULL,
    "fullName" TEXT,
    "dni" TEXT,
    "birthDate" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "age" INTEGER,
    "height" INTEGER,
    "weight" INTEGER,
    "occupation" TEXT,
    "consultReason" TEXT,
    "answers" JSONB NOT NULL,
    "submittedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SymptomForm_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SymptomForm_patientProfileId_key" ON "SymptomForm"("patientProfileId");
