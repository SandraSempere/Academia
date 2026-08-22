-- CreateTable
CREATE TABLE "RuleAuditForm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT NOT NULL,
    "rule1Text" TEXT,
    "rule1Reflection" TEXT,
    "rule1Decision" TEXT,
    "rule2Text" TEXT,
    "rule2Reflection" TEXT,
    "rule2Decision" TEXT,
    "rule3Text" TEXT,
    "rule3Reflection" TEXT,
    "rule3Decision" TEXT,
    "rule4Text" TEXT,
    "rule4Reflection" TEXT,
    "rule4Decision" TEXT,
    "submittedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RuleAuditForm_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RuleAuditForm_patientProfileId_key" ON "RuleAuditForm"("patientProfileId");
