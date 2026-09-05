// Envío de emails vía la API HTTP de Resend — sin SDK (mismo criterio que
// google-drive.ts: una llamada REST directa es más que suficiente para lo
// que necesitamos). SMTP directo (Gmail) se descartó: Railway bloquea las
// conexiones salientes por los puertos 465/587/25 en el plan Hobby, así que
// nodemailer se quedaba colgado varios minutos y nunca llegaba a conectar.
// Resend manda por HTTPS, que no tiene ese problema.
const FROM = process.env.EMAIL_FROM
  ? `Origen Digestivo <${process.env.EMAIL_FROM}>`
  : null;

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

// Firma real de Sandra (mismo logo + datos + aviso legal/RGPD que usa ella
// a mano desde Gmail — texto pasado literal por ella) — se añade a todos
// los emails que le llegan a una paciente. `sendNotificationEmail` (los
// avisos internos a la propia Sandra) la deja fuera explícitamente: no
// tiene sentido firmarle un email a ella misma, y el aviso de RGPD es para
// quien recibe sus datos tratados, no para la propia responsable.
const SIGNATURE_HTML = `
  <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e8e4dd;">
    <img src="${APP_URL}/email-signature-logo.png" alt="Sandra Sempere · Dietista Integrativa" width="150" style="display:block;margin-bottom:14px;border:0;" />
    <p style="margin:0;font-weight:bold;color:#2F3A35;">Sandra Sempere | CEO</p>
    <p style="margin:0;color:#2F3A35;">Dietista Integrativa</p>
    <p style="margin:8px 0 0;"><a href="mailto:info@sandrasempere.com" style="color:#8FA99B;text-decoration:none;">info@sandrasempere.com</a></p>
    <p style="margin:0;"><a href="https://www.sandrasempere.com" style="color:#8FA99B;text-decoration:none;">https://www.sandrasempere.com</a></p>
    <p style="margin:0;"><a href="tel:+34623992928" style="color:#8FA99B;text-decoration:none;">+34 623 99 29 28</a></p>
    <p style="margin:0;color:#2F3A35;">Horario de atención: L-V de 9:00h a 19:00h</p>
  </div>
  <div style="margin-top:20px;font-size:11px;line-height:1.5;color:#8a8a8a;">
    <p style="margin:0 0 8px;">Sea respetuoso con el medioambiente, no imprima este e-mail si no es necesario.</p>
    <p style="margin:0 0 8px;"><strong>AVISO LEGAL:</strong> El contenido de este mensaje y sus archivos adjuntos es CONFIDENCIAL, siendo para uso exclusivo del destinatario arriba mencionado. Si usted lee este mensaje y no es el destinatario indicado, le informamos que está totalmente prohibida cualquier utilización, divulgación, distribución y/o reproducción de esta comunicación sin autorización expresa de SANDRA SEMPERE GUILABERT en virtud de la legislación vigente. Si ha recibido este mensaje por error o no es el destinatario final, por favor, le rogamos nos lo notifique inmediatamente por esta misma vía a <a href="mailto:alimentacionbysandra@gmail.com" style="color:#8a8a8a;">alimentacionbysandra@gmail.com</a> y proceda a su eliminación.</p>
    <p style="margin:0;"><strong>PROTECCIÓN DE DATOS:</strong> De conformidad con lo dispuesto en el Reglamento (UE) 2016/679, de 27 de abril (GDPR), y la Ley Orgánica 3/2018, de 5 de diciembre (LOPDGDD), le informamos de que los datos personales y la dirección de correo electrónico del interesado, se tratarán bajo la responsabilidad de SANDRA SEMPERE GUILABERT por un interés legítimo y para el envío de comunicaciones sobre nuestros productos y servicios, y se conservarán mientras ninguna de las partes se oponga a ello. Los datos no se comunicarán a terceros, salvo obligación legal. Le informamos de que puede ejercer los derechos de acceso, rectificación, portabilidad y supresión de sus datos y los de limitación y oposición a su tratamiento dirigiéndose a Email: <a href="mailto:alimentacionbysandra@gmail.com" style="color:#8a8a8a;">alimentacionbysandra@gmail.com</a>. Si considera que el tratamiento no se ajusta a la normativa vigente, podrá presentar una reclamación ante la autoridad de control en <a href="https://www.aepd.es" style="color:#8a8a8a;">www.aepd.es</a>.</p>
  </div>
`;

const SIGNATURE_TEXT = `

--
Sandra Sempere | CEO
Dietista Integrativa
info@sandrasempere.com
https://www.sandrasempere.com
+34 623 99 29 28
Horario de atención: L-V de 9:00h a 19:00h

Sea respetuoso con el medioambiente, no imprima este e-mail si no es necesario.

AVISO LEGAL: El contenido de este mensaje y sus archivos adjuntos es CONFIDENCIAL, siendo para uso exclusivo del destinatario arriba mencionado. Si usted lee este mensaje y no es el destinatario indicado, le informamos que está totalmente prohibida cualquier utilización, divulgación, distribución y/o reproducción de esta comunicación sin autorización expresa de SANDRA SEMPERE GUILABERT en virtud de la legislación vigente. Si ha recibido este mensaje por error o no es el destinatario final, por favor, le rogamos nos lo notifique inmediatamente por esta misma vía a alimentacionbysandra@gmail.com y proceda a su eliminación.

PROTECCIÓN DE DATOS: De conformidad con lo dispuesto en el Reglamento (UE) 2016/679, de 27 de abril (GDPR), y la Ley Orgánica 3/2018, de 5 de diciembre (LOPDGDD), le informamos de que los datos personales y la dirección de correo electrónico del interesado, se tratarán bajo la responsabilidad de SANDRA SEMPERE GUILABERT por un interés legítimo y para el envío de comunicaciones sobre nuestros productos y servicios, y se conservarán mientras ninguna de las partes se oponga a ello. Los datos no se comunicarán a terceros, salvo obligación legal. Le informamos de que puede ejercer los derechos de acceso, rectificación, portabilidad y supresión de sus datos y los de limitación y oposición a su tratamiento dirigiéndose a Email: alimentacionbysandra@gmail.com. Si considera que el tratamiento no se ajusta a la normativa vigente, podrá presentar una reclamación ante la autoridad de control en www.aepd.es.`;

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function linkifyUrls(escapedText: string) {
  return escapedText.replace(
    /(https?:\/\/[^\s<]+)/g,
    (url) => `<a href="${url}" style="color:#8FA99B;">${url}</a>`,
  );
}

// Convierte el texto plano de cada email (párrafos separados por línea en
// blanco) al mismo contenido en HTML, para poder insertar la firma con
// imagen — Resend no renderiza una foto dentro de un email de solo texto.
function textToHtmlBody(text: string) {
  return text
    .split("\n\n")
    .map((para) => `<p style="margin:0 0 16px;">${linkifyUrls(escapeHtml(para)).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

async function sendEmail(to: string, subject: string, text: string, opts: { signature?: boolean } = {}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !FROM) {
    console.warn("Email no configurado (falta RESEND_API_KEY/EMAIL_FROM) — no enviado:", subject);
    return;
  }

  const withSignature = opts.signature ?? true;
  const finalText = withSignature ? `${text}${SIGNATURE_TEXT}` : text;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#2F3A35;max-width:560px;">${textToHtmlBody(text)}${withSignature ? SIGNATURE_HTML : ""}</div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, text: finalText, html }),
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
// impedir que se guarde el formulario de la paciente. Sin firma: es un
// aviso interno para la propia Sandra, no para una paciente.
export async function sendNotificationEmail(subject: string, text: string) {
  await sendEmail(process.env.EMAIL_TO ?? "", subject, text, { signature: false });
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
