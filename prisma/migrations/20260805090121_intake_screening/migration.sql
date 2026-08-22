-- CreateTable
CREATE TABLE "IntakeScreening" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT NOT NULL,
    "bloatingFrequency" TEXT,
    "unbuttonPants" TEXT,
    "intolerantFoods" TEXT,
    "avoidsPlans" TEXT,
    "timeThinkingDigestion" TEXT,
    "triedRestrictiveDiets" TEXT,
    "confidence" INTEGER,
    "oneThingToChange" TEXT,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IntakeScreening_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "IntakeScreening_patientProfileId_key" ON "IntakeScreening"("patientProfileId");
