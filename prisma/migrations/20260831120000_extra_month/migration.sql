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
    "extraMonthEnabled" BOOLEAN NOT NULL DEFAULT false,
    "extraMonthStartDate" DATETIME,
    "phase" INTEGER NOT NULL DEFAULT 1,
    "activatedAt" DATETIME,
    "activatedSeenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PatientProfile" ("activatedAt", "activatedSeenAt", "createdAt", "id", "phase", "planStartDate", "renewalEnabled", "renewalPlanStartDate", "renewalRevision4Date", "renewalRevision8Date", "revision4Date", "revision8Date", "updatedAt", "userId") SELECT "activatedAt", "activatedSeenAt", "createdAt", "id", "phase", "planStartDate", "renewalEnabled", "renewalPlanStartDate", "renewalRevision4Date", "renewalRevision8Date", "revision4Date", "revision8Date", "updatedAt", "userId" FROM "PatientProfile";
DROP TABLE "PatientProfile";
ALTER TABLE "new_PatientProfile" RENAME TO "PatientProfile";
CREATE UNIQUE INDEX "PatientProfile_userId_key" ON "PatientProfile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
