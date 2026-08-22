-- CreateTable
CREATE TABLE "ClinicalNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClinicalNote_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PatientProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planStartDate" DATETIME,
    "revision4Date" DATETIME,
    "revision8Date" DATETIME,
    "renewalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "renewalPlanStartDate" DATETIME,
    "renewalRevision4Date" DATETIME,
    "renewalRevision8Date" DATETIME,
    "phase" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PatientProfile" ("createdAt", "id", "phase", "planStartDate", "renewalEnabled", "renewalPlanStartDate", "renewalRevision4Date", "renewalRevision8Date", "revision4Date", "revision8Date", "updatedAt", "userId") SELECT "createdAt", "id", "phase", "planStartDate", "renewalEnabled", "renewalPlanStartDate", "renewalRevision4Date", "renewalRevision8Date", "revision4Date", "revision8Date", "updatedAt", "userId" FROM "PatientProfile";
DROP TABLE "PatientProfile";
ALTER TABLE "new_PatientProfile" RENAME TO "PatientProfile";
CREATE UNIQUE INDEX "PatientProfile_userId_key" ON "PatientProfile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ClinicalNote_patientProfileId_date_idx" ON "ClinicalNote"("patientProfileId", "date");

