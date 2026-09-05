// Envío de emails vía la API HTTP de Resend — sin SDK (mismo criterio que
// google-drive.ts: una llamada REST directa es más que suficiente para lo
// que necesitamos). SMTP directo (Gmail) se descartó: Railway bloquea las
// conexiones salientes por los puertos 465/587/25 en el plan Hobby, así que
// nodemailer se quedaba colgado varios minutos y nunca llegaba a conectar.
// Resend manda por HTTPS, que no tiene ese problema.
const FROM = process.env.EMAIL_FROM
  ? `Origen Digestivo <${process.env.EMAIL_FROM}>`
  : null;

async function sendEmail(to: string, subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !FROM) {
    console.warn("Email no configurado (falta RESEND_API_KEY/EMAIL_FROM) — no enviado:", subject);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, text }),
      // Sin esto, una respuesta que nunca llega de Resend deja la petición
      // colgada indefinidamente y bloquea con ella a quien esté esperando
      // este envío (p.ej. el cron de recordatorios, que manda uno a uno).
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.error("Error enviando email:", subject, "->", res.status, await res.text());
    }
  } catch (err) {
    console.error("Error enviando email:", subject, err);
  }
}

// No lanza si falla el envío — un aviso por email que no llega no debe
// impedir que se guarde el formulario de la paciente.
export async function sendNotificationEmail(subject: string, text: string) {
  await sendEmail(process.env.EMAIL_TO ?? "", subject, text);
}

// Recordatorio a la propia paciente de que le toca rellenar su Formulario de
// revisión quincenal (semana 2/6/10) — uno el día antes y otro el día
// exacto (`when`) — a diferencia de sendNotificationEmail (siempre a la
// coach), este va al email de la paciente.
export async function sendPatientFormReminderEmail(
  to: string,
  name: string,
  week: 2 | 6 | 10 | 14,
  when: "hoy" | "mañana",
  cycle: 1 | 2 = 1,
) {
  // Igual que en el resto de avisos con ciclo (revisión quincenal, PDFs...):
  // si algún día coincide que a la misma paciente le toca la misma semana en
  // el programa original y en la renovación el mismo día, que los dos
  // emails digan cuál es cuál en vez de llegar con el texto idéntico. La
  // semana 14 es siempre del mes extra (nunca coincide con 2/6/10), así que
  // no depende del ciclo.
  const cycleSuffix = week === 14 ? " · Mes extra" : cycle === 2 ? " · Renovación" : "";
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

  await sendEmail(to, subject, text);
}

// Recordatorio a la paciente de su próxima cita de revisión (semana
// 4/8/12, renovación o la final del mes extra) — mismo texto el día antes
// y el mismo día (ya incluye la fecha y hora exactas, así que no hace
// falta variar el mensaje según "cuándo", a diferencia del recordatorio de
// formulario quincenal).
export async function sendPatientAppointmentReminderEmail(to: string, name: string, date: Date) {
  const dayLabel = date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const timeLabel = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const text = `¡Hola ${name}!

Te escribo para recordarte tu cita de revisión:

📅 Día: ${dayLabel}
🕒 Hora: ${timeLabel}

Nos vemos en la llamada. Se ruega confirmación a este mismo email.

Si necesitas cambiarla o surge algún imprevisto, avísame con tiempo y lo movemos sin problema.

¡Hasta pronto!
Sandra`;

  await sendEmail(to, "Recordatorio: tu cita de revisión 📅", text);
}

// Bienvenida a una paciente recién dada de alta, con su contraseña
// temporal — se manda una sola vez, al crearla desde el panel de coach.
export async function sendWelcomeEmail(to: string, name: string, password: string) {
  const text = `¡Hola ${name}!

Bienvenida a Origen Digestivo. Estamos encantadas de acompañarte en este proceso.

Para tener tu espacio siempre a mano, instala la app en tu móvil:

📱 iPhone (Safari):
Abre https://app.sandrasempere.com → pulsa el botón de compartir (el cuadrado con la flecha hacia arriba) → "Añadir a pantalla de inicio"

📱 Android (Chrome):
Abre https://app.sandrasempere.com → menú de los tres puntos → "Añadir a pantalla de inicio" o "Instalar aplicación"

Se guardará como una app en tu móvil, lista para abrir cuando quieras.

Para entrar, usa:
Email: ${to}
Contraseña temporal: ${password}

La primera vez que inicies sesión te pedirá cambiar la contraseña.

Antes de nada:
1. Mira el módulo de Bienvenida
2. Rellena cuanto antes el formulario de síntomas

¡Ya tienes todo listo para empezar!`;

  await sendEmail(to, "Bienvenida a Origen Digestivo 🌿", text);
}

// "¿Olvidaste tu contraseña?" — enlace de un solo uso, válido 1 hora.
export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  const text = `Hola ${name || ""},\n\nHas pedido restablecer tu contraseña de la Academia. Entra en este enlace para elegir una nueva (válido 1 hora):\n\n${resetUrl}\n\nSi no has sido tú, ignora este email — tu contraseña actual sigue funcionando.\n\nUn abrazo,\nSandra`;
  await sendEmail(to, "Restablecer tu contraseña", text);
}

// Aviso (siempre, además de la notificación push si la tiene activada) de
// que Sandra le ha subido un Plan nutricional nuevo.
export async function sendPlanNutricionalEmail(to: string, name: string) {
  const text = `¡Hola ${name}!

Ya tienes tu plan nutricional personalizado disponible en tu espacio de Origen Digestivo.

He preparado cada parte pensando en tu caso concreto — te recomiendo leerlo con calma antes de empezar a aplicarlo, para que entiendas el porqué de cada cosa y no solo el qué.

Entra en tu espacio cuando puedas para verlo.

Cualquier duda que te surja, aquí estoy.

Un abrazo,
Sandra`;
  await sendEmail(to, "Tu plan nutricional ya está listo 🌿", text);
}

// Aviso (siempre, además de la notificación push si la tiene activada) de
// que Sandra le ha dejado un vídeo respondiendo a su revisión quincenal.
export async function sendQuincenalVideoEmail(to: string, name: string) {
  const text = `¡Hola ${name}!

Ya he revisado tu formulario de seguimiento y te he dejado un vídeo personalizado con todo lo que he visto: cómo vas evolucionando, qué está funcionando bien y qué ajustes tocan a partir de ahora.

Entra en tu espacio de Origen Digestivo cuando puedas para verlo con calma.

Si después de verlo te queda alguna duda, aquí estoy.

Un abrazo,
Sandra`;
  await sendEmail(to, "Tu revisión ya está lista 🎥", text);
}
