-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT,
    "title" TEXT,
    "date" DATETIME NOT NULL,
    "notes" TEXT,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("createdAt", "date", "id", "notes", "patientProfileId", "source", "updatedAt") SELECT "createdAt", "date", "id", "notes", "patientProfileId", "source", "updatedAt" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
CREATE INDEX "Appointment_date_idx" ON "Appointment"("date");
CREATE UNIQUE INDEX "Appointment_patientProfileId_source_key" ON "Appointment"("patientProfileId", "source");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

