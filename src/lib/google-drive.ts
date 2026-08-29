// Copia de seguridad en Google Drive vía llamadas directas a las APIs REST
// de Google (OAuth2 + Drive v3) — sin el SDK `googleapis`, que es mucho más
// pesado de lo que necesitamos para subir/listar/descargar unos pocos
// archivos dentro de una carpeta propia de la app.
import { prisma } from "@/lib/prisma";

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "";
const REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "";
const FOLDER_NAME = "Origen Digestivo · Copias de seguridad";

// Alcance mínimo para Drive: solo archivos creados por esta app, nunca el
// resto del Drive de la coach. El de Sheets es más amplio a la fuerza —
// para escribir en una hoja ya existente de la coach (no creada por la
// app) no hay un alcance "solo esta hoja" sin pasar por el selector de
// archivos de Google (Picker), así que se pide acceso a todas sus hojas.
const SCOPE = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets";

export function getGoogleAuthUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`No se pudo intercambiar el código de Google: ${await res.text()}`);
  return res.json() as Promise<{ access_token: string; refresh_token?: string; expires_in: number }>;
}

export async function getAccessToken(): Promise<string> {
  const config = await prisma.backupConfig.findUnique({ where: { id: "singleton" } });
  if (!config) throw new Error("No hay ninguna cuenta de Google Drive conectada.");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: config.refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`No se pudo renovar el acceso a Google Drive: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function ensureBackupFolder(accessToken: string): Promise<string> {
  const config = await prisma.backupConfig.findUnique({ where: { id: "singleton" } });
  if (config?.folderId) return config.folderId;

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    )}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const searchData = (await searchRes.json()) as { files?: { id: string }[] };
  if (searchData.files && searchData.files.length > 0) {
    const folderId = searchData.files[0].id;
    await prisma.backupConfig.update({ where: { id: "singleton" }, data: { folderId } });
    return folderId;
  }

  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
  });
  if (!createRes.ok) throw new Error(`No se pudo crear la carpeta de copias en Drive: ${await createRes.text()}`);
  const created = (await createRes.json()) as { id: string };
  await prisma.backupConfig.update({ where: { id: "singleton" }, data: { folderId: created.id } });
  return created.id;
}

export async function uploadBackup(filename: string, bytes: Buffer) {
  const accessToken = await getAccessToken();
  const folderId = await ensureBackupFolder(accessToken);

  const boundary = "origen-digestivo-backup-boundary";
  const metadata = JSON.stringify({ name: filename, parents: [folderId] });
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`,
    ),
    bytes,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!res.ok) throw new Error(`No se pudo subir la copia a Drive: ${await res.text()}`);
  return res.json() as Promise<{ id: string; name: string }>;
}

export async function listBackups() {
  const accessToken = await getAccessToken();
  const folderId = await ensureBackupFolder(accessToken);

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `'${folderId}' in parents and trashed = false`,
    )}&fields=files(id,name,createdTime,size)&orderBy=createdTime desc`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`No se pudieron listar las copias de Drive: ${await res.text()}`);
  const data = (await res.json()) as {
    files?: { id: string; name: string; createdTime: string; size?: string }[];
  };
  return data.files ?? [];
}

export async function downloadBackup(fileId: string): Promise<Buffer> {
  const accessToken = await getAccessToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`No se pudo descargar la copia de Drive: ${await res.text()}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
