import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) return null;

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
  return transporter;
}

// No lanza si falla el envío — un aviso por email que no llega no debe
// impedir que se guarde el formulario de la paciente.
export async function sendNotificationEmail(subject: string, text: string) {
  const t = getTransporter();
  if (!t) {
    console.warn("Email no configurado (falta EMAIL_USER/EMAIL_APP_PASSWORD) — aviso no enviado:", subject);
    return;
  }

  try {
    await t.sendMail({
      from: `"Origen Digestivo" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO ?? process.env.EMAIL_USER,
      subject,
      text,
    });
  } catch (err) {
    console.error("Error enviando email de aviso:", err);
  }
}

// Recordatorio a la propia paciente de que le toca rellenar su Formulario de
// revisión quincenal (semana 2/6/10) — uno el día antes y otro el día
// exacto (`when`) — a diferencia de sendNotificationEmail (siempre a la
// coach), este va al email de la paciente.
export async function sendPatientFormReminderEmail(
  to: string,
  name: string,
  week: 2 | 6 | 10,
  when: "hoy" | "mañana",
) {
  const t = getTransporter();
  if (!t) {
    console.warn("Email no configurado — recordatorio no enviado a", to, "semana", week, when);
    return;
  }

  const whenText = when === "hoy" ? "Hoy toca" : "Mañana toca";
  try {
    await t.sendMail({
      from: `"Origen Digestivo" <${process.env.EMAIL_USER}>`,
      to,
      subject: `${whenText} tu revisión quincenal · Semana ${week}`,
      text: `Hola ${name || ""},\n\n${whenText.toLowerCase()} rellenar tu revisión quincenal de la semana ${week}. Entra en tu Academia y la encontrarás en Mi progreso.\n\nUn abrazo,\nSandra`,
    });
  } catch (err) {
    console.error("Error enviando recordatorio a paciente:", err);
  }
}

// "¿Olvidaste tu contraseña?" — enlace de un solo uso, válido 1 hora.
export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  const t = getTransporter();
  if (!t) {
    console.warn("Email no configurado — enlace de restablecer contraseña no enviado a", to);
    return;
  }

  try {
    await t.sendMail({
      from: `"Origen Digestivo" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Restablecer tu contraseña",
      text: `Hola ${name || ""},\n\nHas pedido restablecer tu contraseña de la Academia. Entra en este enlace para elegir una nueva (válido 1 hora):\n\n${resetUrl}\n\nSi no has sido tú, ignora este email — tu contraseña actual sigue funcionando.\n\nUn abrazo,\nSandra`,
    });
  } catch (err) {
    console.error("Error enviando email de restablecer contraseña:", err);
  }
}
