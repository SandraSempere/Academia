-- CreateTable
CREATE TABLE "MealDiaryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "MealDiaryEntry_patientProfileId_week_day_key" ON "MealDiaryEntry"("patientProfileId", "week", "day");
