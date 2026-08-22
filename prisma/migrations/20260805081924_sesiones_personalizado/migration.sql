-- AlterTable
ALTER TABLE "CheckIn" ADD COLUMN "coachResponseVideoUrl" TEXT;

-- CreateTable
CREATE TABLE "ProgressCheckpoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "daysBloating" TEXT,
    "toleratedFoods" TEXT,
    "avoidsPlans" TEXT,
    "confidence" INTEGER,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProgressCheckpoint_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "reintroductionUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "reintroductionContent" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PatientPlan_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PatientPlan" ("actionPlanFirstMonth", "id", "nutritionalPlan", "patientProfileId", "supplementation", "updatedAt") SELECT "actionPlanFirstMonth", "id", "nutritionalPlan", "patientProfileId", "supplementation", "updatedAt" FROM "PatientPlan";
DROP TABLE "PatientPlan";
ALTER TABLE "new_PatientPlan" RENAME TO "PatientPlan";
CREATE UNIQUE INDEX "PatientPlan_patientProfileId_key" ON "PatientPlan"("patientProfileId");
CREATE TABLE "new_Resource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "moduleId" TEXT,
    CONSTRAINT "Resource_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Resource" ("category", "id", "moduleId", "order", "title", "type", "url") SELECT "category", "id", "moduleId", "order", "title", "type", "url" FROM "Resource";
DROP TABLE "Resource";
ALTER TABLE "new_Resource" RENAME TO "Resource";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ProgressCheckpoint_patientProfileId_week_key" ON "ProgressCheckpoint"("patientProfileId", "week");
