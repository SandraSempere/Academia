// Cifrado de la "copia cifrada" — AES-256-GCM con clave derivada de la
// contraseña que elige la coach al hacer la copia. Todo con el módulo
// `crypto` nativo de Node, sin dependencias nuevas.
import { randomBytes, scryptSync, createCipheriv, createDecipheriv } from "node:crypto";

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

export function encryptBuffer(data: Buffer, passphrase: string): Buffer {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = scryptSync(passphrase, salt, KEY_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // formato: salt (16) + iv (12) + authTag (16) + datos cifrados
  return Buffer.concat([salt, iv, authTag, encrypted]);
}

export function decryptBuffer(data: Buffer, passphrase: string): Buffer {
  const salt = data.subarray(0, SALT_LENGTH);
  const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + 16);
  const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + 16);
  const key = scryptSync(passphrase, salt, KEY_LENGTH);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
