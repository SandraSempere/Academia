-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PATIENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PatientProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phase" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT NOT NULL,
    "actionPlanFirstMonth" TEXT,
    "nutritionalPlan" TEXT,
    "supplementation" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PatientPlan_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order" INTEGER NOT NULL,
    "icon" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "videoUrl" TEXT,
    "body" TEXT,
    CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "WeekBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order" INTEGER NOT NULL,
    "label" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "WeekBlockItemTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekBlockId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    CONSTRAINT "WeekBlockItemTemplate_weekBlockId_fkey" FOREIGN KEY ("weekBlockId") REFERENCES "WeekBlock" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientChecklistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT NOT NULL,
    "itemTemplateId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    CONSTRAINT "PatientChecklistItem_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PatientChecklistItem_itemTemplateId_fkey" FOREIGN KEY ("itemTemplateId") REFERENCES "WeekBlockItemTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "symptomsText" TEXT,
    "energyLevel" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckIn_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PatientProfile_userId_key" ON "PatientProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientPlan_patientProfileId_key" ON "PatientPlan"("patientProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientChecklistItem_patientProfileId_itemTemplateId_key" ON "PatientChecklistItem"("patientProfileId", "itemTemplateId");
