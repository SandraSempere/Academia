-- La migración anterior (RENAME COLUMN) dejó "planStartDate" con el mismo
-- "NOT NULL DEFAULT CURRENT_TIMESTAMP" real de la columna vieja "startDate"
-- a nivel de SQLite — SQLite no permite quitar un DEFAULT con ALTER COLUMN,
-- solo renombrar. Esto hacía que cada paciente nueva recibiera una fecha de
-- inicio de plan automática al darla de alta, en vez de quedarse vacía hasta
-- que la coach suba el primer Plan nutricional (comportamiento pedido).
-- Se recrea la tabla con la columna realmente nullable y sin default, y se
-- pone a NULL para las filas existentes (ninguna tenía aún un Plan
-- nutricional real subido).
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_PatientProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planStartDate" DATETIME,
    "phase" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_PatientProfile" ("id", "userId", "planStartDate", "phase", "notes", "createdAt", "updatedAt")
SELECT "id", "userId", NULL, "phase", "notes", "createdAt", "updatedAt" FROM "PatientProfile";

DROP TABLE "PatientProfile";
ALTER TABLE "new_PatientProfile" RENAME TO "PatientProfile";

CREATE UNIQUE INDEX "PatientProfile_userId_key" ON "PatientProfile"("userId");

PRAGMA foreign_keys=ON;
