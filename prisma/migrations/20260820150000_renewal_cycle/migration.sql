-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MealDiaryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT NOT NULL,
    "cycle" INTEGER NOT NULL DEFAULT 1,
    "week" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "breakfast" TEXT,
    "breakfastDigestion" TEXT,
    "lunch" TEXT,
    "lunchDigestion" TEXT,
    "dinner" TEXT,
    "dinnerDigestion" TEXT,
    "bathroom" TEXT,
    "notes" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MealDiaryEntry_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MealDiaryEntry" ("bathroom", "breakfast", "breakfastDigestion", "day", "dinner", "dinnerDigestion", "id", "lunch", "lunchDigestion", "notes", "patientProfileId", "updatedAt", "week") SELECT "bathroom", "breakfast", "breakfastDigestion", "day", "dinner", "dinnerDigestion", "id", "lunch", "lunchDigestion", "notes", "patientProfileId", "updatedAt", "week" FROM "MealDiaryEntry";
DROP TABLE "MealDiaryEntry";
ALTER TABLE "new_MealDiaryEntry" RENAME TO "MealDiaryEntry";
CREATE UNIQUE INDEX "MealDiaryEntry_patientProfileId_cycle_week_day_key" ON "MealDiaryEntry"("patientProfileId", "cycle", "week", "day");
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
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PatientProfile" ("createdAt", "id", "notes", "phase", "planStartDate", "revision4Date", "revision8Date", "updatedAt", "userId") SELECT "createdAt", "id", "notes", "phase", "planStartDate", "revision4Date", "revision8Date", "updatedAt", "userId" FROM "PatientProfile";
DROP TABLE "PatientProfile";
ALTER TABLE "new_PatientProfile" RENAME TO "PatientProfile";
CREATE UNIQUE INDEX "PatientProfile_userId_key" ON "PatientProfile"("userId");
CREATE TABLE "new_QuincenalForm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT NOT NULL,
    "cycle" INTEGER NOT NULL DEFAULT 1,
    "week" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "coachVideoUrl" TEXT,
    "submittedAt" DATETIME,
    "reviewedAt" DATETIME,
    "reminderSentAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuincenalForm_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_QuincenalForm" ("answers", "coachVideoUrl", "id", "patientProfileId", "reminderSentAt", "reviewedAt", "submittedAt", "updatedAt", "week") SELECT "answers", "coachVideoUrl", "id", "patientProfileId", "reminderSentAt", "reviewedAt", "submittedAt", "updatedAt", "week" FROM "QuincenalForm";
DROP TABLE "QuincenalForm";
ALTER TABLE "new_QuincenalForm" RENAME TO "QuincenalForm";
CREATE UNIQUE INDEX "QuincenalForm_patientProfileId_cycle_week_key" ON "QuincenalForm"("patientProfileId", "cycle", "week");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

