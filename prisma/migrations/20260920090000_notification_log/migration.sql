-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "resendId" TEXT,
    "openedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotificationLog_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "NotificationLog_patientProfileId_createdAt_idx" ON "NotificationLog"("patientProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationLog_resendId_idx" ON "NotificationLog"("resendId");
