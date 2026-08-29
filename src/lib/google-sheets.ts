// Añade una fila a la hoja de Google Sheets de la coach (ya existente, no
// creada por la app) cada vez que una paciente envía por primera vez el
// Formulario de síntomas — misma cuenta de Google que la Copia de
// seguridad (ver google-drive.ts), reutilizando su token de acceso.
import { getAccessToken } from "@/lib/google-drive";

const SPREADSHEET_ID = process.env.PATIENTS_SHEET_ID ?? "";

async function getFirstSheetTitle(accessToken: string): Promise<string> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets.properties.title`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`No se pudo leer la hoja de pacientes: ${await res.text()}`);
  const data = (await res.json()) as { sheets?: { properties: { title: string } }[] };
  const title = data.sheets?.[0]?.properties.title;
  if (!title) throw new Error("La hoja de pacientes no tiene ninguna pestaña.");
  return title;
}

// No lanza si falla — igual que sendNotificationEmail, esto es secundario
// y no debe impedir que el formulario de la paciente se guarde bien.
export async function appendPatientToSheet(patient: {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  province: string | null;
}) {
  if (!SPREADSHEET_ID) {
    console.warn("PATIENTS_SHEET_ID no configurado — no se añade la fila a Sheets.");
    return;
  }

  try {
    const accessToken = await getAccessToken();
    const sheetTitle = await getFirstSheetTitle(accessToken);

    const row = [
      patient.firstName ?? "",
      patient.lastName ?? "",
      patient.phone ?? "",
      patient.email ?? "",
      patient.city ?? "",
      patient.province ?? "",
      "España",
    ];

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(
        sheetTitle,
      )}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [row] }),
      },
    );
    if (!res.ok) {
      console.error("Error añadiendo paciente al Sheets:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Error añadiendo paciente al Sheets:", err);
  }
}
