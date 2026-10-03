-- CRM de leads, fase 1: roles SETTER/CLOSER (Role es TEXT en SQLite, no
-- hace falta tocar la columna) y campos del apartado "Equipo CRM".
-- ADD COLUMN en vez de recrear la tabla User: no toca ninguna fila existente.
ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lastSeenAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "takesCalls" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "invitedAt" DATETIME;

-- La admin (Sandra) hace llamadas desde el principio.
UPDATE "User" SET "takesCalls" = true WHERE "role" = 'COACH';
