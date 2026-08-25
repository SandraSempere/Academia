import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) return null;

  transporter = nodemailer.createTransport({
    // Puerto 587 + STARTTLS en vez del 465 (SSL directo) que usaba el atajo
    // "service: gmail" — en producción (Railway) el 465 se quedaba colgado
    // varios minutos hasta dar ETIMEDOUT (típico de un puerto bloqueado o
    // filtrado), el 587 suele pasar mejor por ese tipo de restricciones.
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
    // Si no conecta, que falle rápido (unos segundos) en vez de colgar la
    // acción del usuario varios minutos — el email nunca debe bloquear el
    // guardado real de datos.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
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
  cycle: 1 | 2 = 1,
) {
  const t = getTransporter();
  if (!t) {
    console.warn("Email no configurado — recordatorio no enviado a", to, "semana", week, when);
    return;
  }

  // Igual que en el resto de avisos con ciclo (revisión quincenal, PDFs...):
  // si algún día coincide que a la misma paciente le toca la misma semana en
  // el programa original y en la renovación el mismo día, que los dos
  // emails digan cuál es cuál en vez de llegar con el texto idéntico.
  const cycleSuffix = cycle === 2 ? " · Renovación" : "";
  const subject =
    when === "hoy"
      ? `Hoy toca tu seguimiento${cycleSuffix} 📋`
      : `Mañana toca tu seguimiento${cycleSuffix} 📋`;
  const text =
    when === "hoy"
      ? `¡Hola ${name}!

Hoy toca tu seguimiento${cycleSuffix} de la semana ${week}. Entra en tu espacio de Origen Digestivo y rellena el formulario — así puedo ver cómo estás evolucionando de verdad y ajustar lo que haga falta para seguir avanzando contigo.

No necesitas hacerlo perfecto, solo contarme cómo estás.

Un abrazo,
Sandra`
      : `¡Hola ${name}!

Mañana es tu seguimiento${cycleSuffix} de la semana ${week}. Es un buen momento para parar un momento y pensar en cómo has ido estos días — qué ha mejorado, qué sigue costando, cómo te sientes.

Cuando puedas, entra en tu espacio de Origen Digestivo y prepárate para rellenar el formulario mañana.

Nos vemos ahí 🌿
Sandra`;

  try {
    await t.sendMail({
      from: `"Origen Digestivo" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error("Error enviando recordatorio a paciente:", err);
  }
}

// Bienvenida a una paciente recién dada de alta, con su contraseña
// temporal — se manda una sola vez, al crearla desde el panel de coach.
export async function sendWelcomeEmail(to: string, name: string, password: string) {
  const t = getTransporter();
  if (!t) {
    console.warn("Email no configurado — bienvenida no enviada a", to);
    return;
  }

  try {
    await t.sendMail({
      from: `"Origen Digestivo" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Bienvenida a Origen Digestivo 🌿",
      text: `¡Hola ${name}!

Bienvenida a Origen Digestivo. Estamos encantadas de acompañarte en este proceso.

Para tener tu espacio siempre a mano, instala la app en tu móvil:

📱 iPhone (Safari):
Abre app.sandrasempere.com → pulsa el botón de compartir (el cuadrado con la flecha hacia arriba) → "Añadir a pantalla de inicio"

📱 Android (Chrome):
Abre app.sandrasempere.com → menú de los tres puntos → "Añadir a pantalla de inicio" o "Instalar aplicación"

Se guardará como una app en tu móvil, lista para abrir cuando quieras.

Para entrar, usa:
Email: ${to}
Contraseña temporal: ${password}

La primera vez que inicies sesión te pedirá cambiar la contraseña.

Antes de nada:
1. Mira el módulo de Bienvenida
2. Rellena cuanto antes el formulario de síntomas

¡Ya tienes todo listo para empezar!`,
    });
  } catch (err) {
    console.error("Error enviando email de bienvenida:", err);
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
