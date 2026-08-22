/*
  Warnings:

  - You are about to drop the column `reintroductionContent` on the `PatientPlan` table. All the data in the column will be lost.
  - You are about to drop the column `reintroductionUnlocked` on the `PatientPlan` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PatientPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT NOT NULL,
    "actionPlanFirstMonth" TEXT,
    "nutritionalPlan" TEXT,
    "supplementation" TEXT,
    "videoComoEmpezar" TEXT,
    "videoQueEstamosBuscando" TEXT,
    "videoLoomPlan" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PatientPlan_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PatientPlan" ("actionPlanFirstMonth", "id", "nutritionalPlan", "patientProfileId", "supplementation", "updatedAt", "videoComoEmpezar", "videoLoomPlan", "videoQueEstamosBuscando") SELECT "actionPlanFirstMonth", "id", "nutritionalPlan", "patientProfileId", "supplementation", "updatedAt", "videoComoEmpezar", "videoLoomPlan", "videoQueEstamosBuscando" FROM "PatientPlan";
DROP TABLE "PatientPlan";
ALTER TABLE "new_PatientPlan" RENAME TO "PatientPlan";
CREATE UNIQUE INDEX "PatientPlan_patientProfileId_key" ON "PatientPlan"("patientProfileId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
