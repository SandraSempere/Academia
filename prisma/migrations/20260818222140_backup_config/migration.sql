-- CreateTable
CREATE TABLE "BackupConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "refreshToken" TEXT NOT NULL,
    "folderId" TEXT,
    "connectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
