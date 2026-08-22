-- Renombra "startDate" (nunca usado en la app, siempre igual a la fecha de
-- creación de la paciente) a "planStartDate" (nullable, sin valor por
-- defecto) — ahora se pone sola al subir el primer Plan nutricional, en vez
-- de fijarse automáticamente al dar de alta a la paciente.
ALTER TABLE "PatientProfile" RENAME COLUMN "startDate" TO "planStartDate";
