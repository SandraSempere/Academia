-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PatientPlanFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "cycle" INTEGER NOT NULL DEFAULT 1,
    "slot" INTEGER NOT NULL,
    "url" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PatientPlanFile_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PatientPlanFile" ("category", "id", "patientProfileId", "slot", "updatedAt", "url") SELECT "category", "id", "patientProfileId", "slot", "updatedAt", "url" FROM "PatientPlanFile";
DROP TABLE "PatientPlanFile";
ALTER TABLE "new_PatientPlanFile" RENAME TO "PatientPlanFile";
CREATE UNIQUE INDEX "PatientPlanFile_patientProfileId_category_cycle_slot_key" ON "PatientPlanFile"("patientProfileId", "category", "cycle", "slot");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

