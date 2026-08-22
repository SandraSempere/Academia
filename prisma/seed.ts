import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

type LessonSeed = { title: string; videoUrl?: string; body?: string };

const MODULES: Array<{
  order: number;
  icon: string;
  title: string;
  description: string;
  lessons: LessonSeed[];
}> = [
  {
    order: 0,
    icon: "👋",
    title: "Bienvenida y soporte",
    description:
      "Antes de empezar con tu plan, mira este módulo y rellena el formulario inicial.",
    lessons: [
      { title: "Bienvenida", videoUrl: "https://youtube.com/shorts/2Zq6s86ES5M?feature=share" },
      {
        title: "Léeme primero · Bienvenida a Origen Digestivo",
        body: "Si estás leyendo esto, es porque has decidido darle una oportunidad más a tu digestión. Y esta vez va a ser diferente.\n\nNo estás aquí para hacer otra dieta más. Estás aquí para salir del bucle de probar cosas, eliminar alimentos, sentir alivio unos días y volver a estar igual. Ese bucle no es porque tú lo estés haciendo mal. Es lo que pasa cuando intentamos arreglar con restricción algo que en realidad necesita entenderse desde el origen.\n\nAquí no vas a encontrar listas de alimentos prohibidos ni normas rígidas que cumplir a rajatabla. Vas a aprender a entender qué le pasa a tu digestión, para poder volver a confiar en lo que comes.\n\nY quiero que sepas algo antes de empezar: no tienes que hacerlo perfecto. Vas a tener semanas mejores y semanas más regulares, y las dos forman parte del proceso. Lo único que te pido es que no te rindas cuando algo no salga como esperabas. Para eso estoy aquí.\n\nLo que este proceso NO es:\n· No hay alimentos prohibidos para siempre. Hay digestiones que necesitan ser trabajadas.\n· No vas a eliminar por eliminar. Cada cosa que hagamos tiene un motivo.\n· No hay que hacerlo perfecto. Los tropiezos se acompañan, no se castigan.\n· No estás sola en esto. Estoy contigo en cada paso.\n\nTus primeros pasos, hoy mismo:\n1. Mira los vídeos de este bloque en orden.\n2. Rellena el formulario de síntomas para tenerlo antes de nuestra primera sesión.\n3. Guarda mi contacto de WhatsApp, para cuando tengas dudas.\n\nNos vemos en el siguiente paso 💛",
      },
      {
        title: "Tus asistentes · Guía rápida",
        body: "Además de mí, vas a tener tu Asistente Origen Digestivo, entrenado con mi forma de trabajar.\n\n¿Para qué lo puedes usar?\n▪ Saber si un alimento te puede sentar bien según tu fase\n▪ Dudas rápidas del día a día\n▪ Recomendaciones de marcas y productos\n\nPara qué NO es:\nTu asistente resuelve el día a día. Si tienes una duda que te preocupa de verdad, escríbeme por WhatsApp.\n\nNecesitas una cuenta gratuita de ChatGPT para usarlo.\n\n[Asistente Digestivo](https://chatgpt.com/g/g-6a520c55f4048191b8c40ffad2fcba43-sandra-asistente-digestivo)",
      },
      { title: "Cómo vamos a trabajar juntas", videoUrl: "https://youtube.com/shorts/JzNebn3G6_k?feature=share" },
      { title: "Cómo usar este espacio para que el proceso tenga sentido", videoUrl: "https://youtube.com/shorts/gbheEoLFjRM?feature=share" },
      {
        title: "💬 Cómo funciona el WhatsApp",
        body: "Estoy aquí para acompañarte en cada paso.\n\n📱 WhatsApp\nPuedes escribirme cuando tengas dudas, necesites aclarar algo del plan o quieras contarme cómo te vas encontrando.\n\nResponderé en un plazo máximo de 24h de lunes a viernes, en estas franjas:\n- Por la mañana: de 10:00 a 11:00h\n- Por la tarde: de 19:00 a 20:00h\n- Los fines de semana los dejamos para descansar 🙂\n\nSi escribes fuera de esos horarios no pasa nada, te responderé en el siguiente momento disponible. No es necesario reenviar el mensaje ni volver a escribir si aún no he contestado: lo leo todo y lo tengo en cuenta.\n\n📞 Videollamadas incluidas\n→ Semana 1: Primera videollamada de valoración general\n→ Semana 4: Primera revisión y ajustes\n→ Semana 8: Segunda revisión y ajustes\n→ Semana 12: Sesión de cierre del proceso\n\nSe programan por WhatsApp con antelación.\n\nNo estás sola en esto. Si tienes dudas, escríbeme 💛",
      },
    ],
  },
  {
    order: 1,
    icon: "🧠",
    title: "Módulo 1 — Entiende lo que te está pasando",
    description:
      "Si llevas tiempo haciendo cosas y sin entender muy bien por qué, este bloque es para ti.",
    lessons: [
      { title: "Mi historia personal. Por qué entiendo lo que estás viviendo.", videoUrl: "https://youtube.com/shorts/5noj-y9vD5c?feature=share" },
      { title: "Por qué puedes seguir con síntomas aunque lleves tiempo intentándolo", videoUrl: "https://youtube.com/shorts/Bg5nx387LDQ?feature=share" },
      { title: "Qué puede haber detrás de tu SIBO", videoUrl: "https://youtube.com/shorts/vr2VuKGmNhQ?feature=share" },
      { title: "Tu sistema digestivo: las tres barreras", videoUrl: "https://youtu.be/ELFsBAGJ2N0" },
      {
        title: "El papel de tu microbiota (y por qué tu intestino habla con todo tu cuerpo)",
        videoUrl: "https://youtu.be/pbBkjsNwmRY",
      },
      { title: "Por qué el ácido de tu estómago importa", videoUrl: "https://youtu.be/DlRhe17n4Y8" },
      { title: "Estrés, sistema nervioso y digestión", videoUrl: "https://youtu.be/kDsE1IgQFGw" },
      {
        title: "El barrendero de tu intestino (el Complejo Motor Migratorio)",
        videoUrl: "https://youtu.be/-Tm_UHbuRYw",
      },
      { title: "Mitos de la salud digestiva", videoUrl: "https://youtu.be/03KSrcSxYMU" },
      { title: "Auditoría de reglas · Semana 8" },
    ],
  },
  {
    order: 2,
    icon: "☀️",
    title: "Módulo 2 — En tu día a día",
    description:
      "Aquí encontrarás recursos para llevar todo esto a tu vida real sin que sea un problema. Puedes ir consultándolo según lo vayas necesitando, no hace falta que lo leas todo ahora.",
    lessons: [
      { title: "Cómo comer, no solo qué comer", videoUrl: "https://youtu.be/SDRbXr-8L3o" },
      { title: "Cómo organizar tus comidas", videoUrl: "https://youtu.be/YqoG3Cksj1k" },
      { title: "Cómo comer fuera de casa", videoUrl: "https://youtu.be/D6dJO4qhfGE" },
      {
        title: "Cómo elegir en el supermercado y leer etiquetas",
        videoUrl: "https://youtu.be/hvvKrZDh3vU",
      },
      { title: "Cómo disfrutar del verano sin que tu digestión te lo quite", videoUrl: "https://youtu.be/0-D_lC957A4" },
      {
        title: "Comer tarde y tu digestión nocturna",
        body: "Las cenas tarde suelen sentar peor, y no es casualidad. Por la noche tu cuerpo se prepara para descansar, no para el trabajo pesado de digerir — y además, ya viste con el barrendero de tu intestino que necesita esas horas sin comer para poder limpiar bien. Si cenas tarde y te acuestas enseguida, le quitas ese margen.\n\nTambién solemos cenar con más prisa cuando es tarde, porque el día se ha alargado — y ya sabes lo que pasa cuando comes rápido.\n\nNo hace falta cenar a una hora exacta ni vivir mirando el reloj. Pero si puedes, deja un margen de un par de horas entre la cena y dormir, y cena sin prisas. Es un cambio pequeño que se nota en cómo duermes y cómo te levantas.",
      },
      {
        title: "Movimiento ligero después de comer",
        body: "Un paseo corto después de comer — 10-15 minutos, nada intenso — ayuda a que el estómago se vacíe mejor y puede reducir la hinchazón. Nada de gimnasio ni rutinas: basta con moverte un poco, aunque sea dar una vuelta por casa o bajar a la calle.\n\nDeja pasar unos minutos después de comer antes de salir, y que el paseo sea tranquilo, no un paseo rápido ni con prisa. Es un hábito pequeño que, sumado a todo lo demás que ya trabajas, ayuda de verdad.",
      },
    ],
  },
  {
    order: 3,
    icon: "🤷‍♀️",
    title: "Módulo 3 — Cuando las cosas no salen como esperabas",
    description:
      "Algunos días o semanas no van a salir como esperabas, y eso no significa que algo esté fallando. Aquí tienes qué hacer en esos momentos.",
    lessons: [
      { title: "Qué hacer cuando sientes que no avanzas", videoUrl: "https://youtu.be/nbLOXpnOaxA" },
      {
        title: "Pensamiento todo-o-nada tras un retroceso",
        body: "Un mal día no borra las semanas de trabajo que llevas hechas. \"Hoy no ha ido bien\" es muy distinto de \"esto no funciona\" — aunque en el momento se sientan igual.\n\nSi notas que un retroceso puntual se te convierte en \"para qué sigo intentando\", párate un segundo. Eso es el pensamiento todo-o-nada hablando, no la realidad de tu proceso. Volver a intentarlo mañana no es fracasar hoy, es justo lo que toca hacer.",
      },
    ],
  },
  {
    order: 4,
    icon: "🎉",
    title: "Módulo 4 — Cierre y siguiente paso",
    description:
      "Has llegado hasta aquí. Este bloque es para cerrar el proceso con calma y dejarte con herramientas claras para seguir sola.",
    lessons: [
      { title: "Lo que has trabajado y conseguido", videoUrl: "https://youtu.be/xnNd7i4xZds" },
      { title: "Cómo seguir manteniendo lo que has logrado", videoUrl: "https://youtu.be/87gRjdrEeJo" },
      { title: "Señales a las que prestar atención", videoUrl: "https://youtu.be/8H02-ebqJu4" },
    ],
  },
];

const RESOURCES: Array<{
  title: string;
  description?: string;
  category: string;
  type: string;
  url?: string; // sin url: recurso anunciado pero pendiente de enlazar
  moduleOrder?: number; // vincula el recurso a un Module.order (1-4). Sin esto: Bienvenida o Plan y sesiones.
}> = [
  { title: "Formulario de síntomas", category: "Bienvenida", type: "Formulario", url: "https://drive.google.com/file/d/1EfzaXM1_Wb2ocnwMaPUAc6B_ZPA5jHRa/view?usp=drive_link", moduleOrder: 0 },
  { title: "Lo que hará que este proceso funcione de verdad", category: "Bienvenida", type: "Guía", url: "/uploads/recursos/lo-que-hara-que-este-proceso-funcione-de-verdad.pdf", moduleOrder: 0 },
  { title: "Tu línea de intentos y tu carta de compromiso · Semana 2", category: "Módulo 1", type: "Formulario", moduleOrder: 1 },
  { title: "Tu sistema digestivo: las tres barreras", category: "Módulo 1", type: "PDF", url: "/uploads/recursos/tu-sistema-digestivo-las-tres-barreras.pdf", moduleOrder: 1 },
  {
    title: "El papel de tu microbiota (y por qué tu intestino habla con todo tu cuerpo)",
    category: "Módulo 1",
    type: "PDF",
    url: "/uploads/recursos/el-papel-de-tu-microbiota.pdf",
    moduleOrder: 1,
  },
  { title: "Por qué el ácido de tu estómago importa", category: "Módulo 1", type: "PDF", url: "/uploads/recursos/por-que-el-acido-de-tu-estomago-importa.pdf", moduleOrder: 1 },
  { title: "Estrés, sistema nervioso y digestión", category: "Módulo 1", type: "PDF", url: "/uploads/recursos/estres-sistema-nervioso-y-digestion.pdf", moduleOrder: 1 },
  { title: "Mitos de la salud digestiva", category: "Módulo 1", type: "PDF", url: "/uploads/recursos/mitos-de-la-salud-digestiva.pdf", moduleOrder: 1 },
  { title: "Trabajo de mucosas", category: "Módulo 1", type: "PDF", url: "/uploads/recursos/trabajo-de-mucosas.pdf", moduleOrder: 1 },
  { title: "Alimentación muconutritiva", category: "Módulo 1", type: "PDF", url: "/uploads/recursos/alimentacion-muconutritiva.pdf", moduleOrder: 1 },
  { title: "Almidón resistente", category: "Módulo 1", type: "PDF", url: "/uploads/recursos/almidon-resistente.pdf", moduleOrder: 1 },
  { title: "Cuidado de la microbiota oral", category: "Módulo 1", type: "PDF", url: "/uploads/recursos/cuidado-de-la-microbiota-oral.pdf", moduleOrder: 1 },
  { title: "Respiraciones diafragmáticas", category: "Módulo 1", type: "PDF", url: "/uploads/recursos/respiraciones-diafragmaticas.pdf", moduleOrder: 1 },
  { title: "Hábitos para mejorar el sueño", category: "Módulo 1", type: "PDF", url: "/uploads/recursos/habitos-para-mejorar-el-sueno.pdf", moduleOrder: 1 },
  { title: "Kit de calma y descanso", category: "Módulo 1", type: "PDF", url: "/uploads/recursos/kit-de-calma-y-descanso.pdf", moduleOrder: 1 },
  { title: "El barrendero de tu intestino (el Complejo Motor Migratorio)", category: "Módulo 1", type: "PDF", url: "/uploads/recursos/el-barrendero-de-tu-intestino.pdf", moduleOrder: 1 },
  { title: "Micronutrientes para tu digestión y tu energía", category: "Módulo 1", type: "PDF", url: "/uploads/recursos/micronutrientes-para-tu-digestion-y-tu-energia.pdf", moduleOrder: 1 },
  {
    title: "Tu mapa de prioridades digestivas",
    description: "Una guía para entender qué suma a tu digestión y qué puede estar recargándola — sin listas de prohibidos, para decidir tú con calma. Es solo el principio: no hace falta hacerlo perfecto.",
    category: "Módulo 1",
    type: "Guía",
    url: "/uploads/recursos/tu-mapa-de-prioridades-digestivas.pdf",
    moduleOrder: 1,
  },
  { title: "Guía de acompañamiento digestivo", category: "Plan y sesiones", type: "Guía", url: "/uploads/recursos/guia-de-acompanamiento-digestivo.pdf" },
  { title: "Cómo usar tu plan nutricional", category: "Plan y sesiones", type: "Guía", url: "/uploads/recursos/como-usar-tu-plan-nutricional.pdf" },
  { title: "Por qué añadimos suplementación y para qué sirve", category: "Plan y sesiones", type: "Guía", url: "/uploads/recursos/por-que-anadimos-suplementacion.pdf" },
  { title: "Estructura de comidas", category: "Plan y sesiones", type: "PDF", url: "/uploads/recursos/estructura-de-comidas.pdf" },
  { title: "Pautas FODMAP", category: "Plan y sesiones", type: "PDF", url: "/uploads/recursos/pautas-fodmap.pdf" },
  { title: "Equivalencias", category: "Plan y sesiones", type: "PDF", url: "/uploads/recursos/equivalencias.pdf" },
  { title: "Información sobre los desayunos", category: "Plan y sesiones", type: "Guía", url: "/uploads/recursos/informacion-sobre-los-desayunos.pdf" },
  { title: "Información sobre las recetas", category: "Plan y sesiones", type: "Guía", url: "/uploads/recursos/informacion-sobre-las-recetas.pdf" },
  { title: "Recetas básicas y sin complicaciones", category: "Plan y sesiones", type: "Receta", url: "/uploads/recursos/recetas-basicas-y-sin-complicaciones.pdf" },
  { title: "Recetario Airfryer Baja en Fodmap", category: "Plan y sesiones", type: "Receta", url: "/uploads/recursos/recetario-airfryer-baja-en-fodmap.pdf" },
  { title: "Recetas dulces bajas en Fodmap", category: "Plan y sesiones", type: "Receta", url: "/uploads/recursos/recetas-dulces-bajas-en-fodmap.pdf" },
  { title: "Recetario desayunos, cenas y salsas", category: "Plan y sesiones", type: "Receta", url: "/uploads/recursos/recetario-desayunos-cenas-y-salsas.pdf" },
  { title: "Primeros pasos digestivos", category: "Plan y sesiones", type: "Guía", url: "/uploads/recursos/primeros-pasos-digestivos.pdf" },
  { title: "Preguntas frecuentes", category: "Plan y sesiones", type: "Guía", url: "/uploads/recursos/preguntas-frecuentes.pdf" },
  { title: "Cómo comer, no solo qué comer", category: "Módulo 2", type: "PDF", url: "/uploads/recursos/como-comer-no-solo-que-comer-guia.pdf", moduleOrder: 2 },
  { title: "Cómo organizar tus comidas", category: "Módulo 2", type: "PDF", url: "/uploads/recursos/como-organizar-tus-comidas.pdf", moduleOrder: 2 },
  { title: "Plato Harvard", category: "Módulo 2", type: "PDF", url: "/uploads/recursos/plato-harvard.pdf", moduleOrder: 2 },
  { title: "Batch cooking · organiza tu semana", category: "Módulo 2", type: "PDF", url: "/uploads/recursos/batch-cooking-organiza-tu-semana.pdf", moduleOrder: 2 },
  { title: "Cómo comer fuera de casa", category: "Módulo 2", type: "Guía", url: "/uploads/recursos/como-comer-fuera-de-casa.pdf", moduleOrder: 2 },
  {
    title: "Cómo elegir en el supermercado y leer etiquetas",
    category: "Módulo 2",
    type: "PDF",
    url: "/uploads/recursos/como-elegir-en-el-supermercado-y-leer-etiquetas.pdf",
    moduleOrder: 2,
  },
  {
    title: "Cómo disfrutar del verano sin que tu digestión te lo quite",
    category: "Módulo 2",
    type: "PDF",
    url: "/uploads/recursos/como-disfrutar-del-verano-sin-que-tu-digestion-te-lo-quite.pdf",
    moduleOrder: 2,
  },
  { title: "Productos recomendados y dónde encontrarlos", category: "Módulo 2", type: "Guía", url: "/uploads/recursos/productos-recomendados-y-donde-encontrarlos.pdf", moduleOrder: 2 },
  { title: "Pautas para mejorar la hinchazón", category: "Módulo 3", type: "Guía", url: "/uploads/recursos/pautas-para-mejorar-la-hinchazon.pdf", moduleOrder: 3 },
  { title: "Recomendaciones para mejorar digestiones", category: "Módulo 3", type: "Guía", url: "/uploads/recursos/recomendaciones-para-mejorar-digestiones.pdf", moduleOrder: 3 },
  { title: "Pautas para mejorar el estreñimiento", category: "Módulo 3", type: "Guía", url: "/uploads/recursos/pautas-para-mejorar-el-estrenimiento.pdf", moduleOrder: 3 },
  { title: "Protocolo: \"Me he hinchado mucho, ¿qué hago?\"", category: "Módulo 3", type: "Guía", url: "/uploads/recursos/protocolo-me-he-hinchado-mucho.pdf", moduleOrder: 3 },
  { title: "Protocolo: \"He comido fuera y me encuentro mal, ¿qué hago?\"", category: "Módulo 3", type: "Guía", url: "/uploads/recursos/protocolo-he-comido-fuera.pdf", moduleOrder: 3 },
  { title: "SOS de bolsillo", category: "Módulo 3", type: "PDF", url: "/uploads/recursos/sos-de-bolsillo.pdf", moduleOrder: 3 },
  {
    title: "Qué hacer cuando sientes que no avanzas",
    category: "Módulo 3",
    type: "PDF",
    url: "/uploads/recursos/que-hacer-cuando-sientes-que-no-avanzas.pdf",
    moduleOrder: 3,
  },
  { title: "Lo que has trabajado y conseguido", category: "Módulo 4", type: "PDF", url: "/uploads/recursos/lo-que-has-trabajado-y-conseguido.pdf", moduleOrder: 4 },
  {
    title: "Cómo seguir manteniendo lo que has logrado",
    category: "Módulo 4",
    type: "PDF",
    url: "/uploads/recursos/como-seguir-manteniendo-lo-que-has-logrado.pdf",
    moduleOrder: 4,
  },
  { title: "Señales a las que prestar atención", category: "Módulo 4", type: "PDF", url: "/uploads/recursos/senales-a-las-que-prestar-atencion.pdf", moduleOrder: 4 },
  { title: "Guía de mantenimiento", category: "Módulo 4", type: "Guía", moduleOrder: 4 },
  { title: "Formulario de cierre y valoración", category: "Módulo 4", type: "Formulario", url: "https://forms.gle/7qfpzSRk8GuRFSbA9", moduleOrder: 4 },
  { title: "Cómo va a ser mi progreso", category: "Seguimiento", type: "PDF", url: "/uploads/recursos/como-va-a-ser-mi-progreso.pdf" },
  { title: "Revisión quincenal", category: "Seguimiento", type: "Hoja de cálculo", url: "https://docs.google.com/spreadsheets/d/1Oa4fK3eN7ofA4DgLlufbv1lK7evGPeDrRCs1wkDOrVQ/edit?usp=drive_link" },
  { title: "Mi momento de celebración · Semana 6", category: "Seguimiento", type: "PDF", url: "/uploads/recursos/mi-momento-de-celebracion-semana-6.pdf" },
  { title: "Cómo funciona el seguimiento quincenal", category: "Seguimiento", type: "PDF", url: "/uploads/recursos/como-funciona-el-seguimiento-quincenal.pdf" },
  { title: "Por qué a veces no mejoras aunque estés haciendo todo bien", category: "Seguimiento", type: "PDF", url: "/uploads/recursos/por-que-a-veces-no-mejoras.pdf" },
  { title: "Qué puede ir pasando a lo largo del proceso", category: "Seguimiento", type: "PDF", url: "/uploads/recursos/que-puede-ir-pasando-a-lo-largo-del-proceso.pdf" },
];

const WEEK_BLOCKS = [
  {
    order: -1,
    label: "Progreso del programa",
    items: [
      "He rellenado el formulario de síntomas",
      "He firmado el contrato y la política de privacidad",
    ],
  },
  {
    order: 0,
    label: "🏁 Punto de partida",
    items: [
      "He visto el vídeo de bienvenida",
      "He visto cómo vamos a trabajar juntas",
      "Cómo usar este espacio para que el proceso tenga sentido",
      "Cómo funciona la app",
      "He recibido mi plan nutricional personalizado",
      "Empiezo a registrar mis comidas y cómo me siento",
    ],
  },
  {
    order: 1,
    label: "Semanas 1-2 · Empezamos a trabajar la digestión",
    items: [
      "Empiezo a seguir mi plan nutricional",
      "Empiezo a estructurar mis comidas durante el día",
      "Voy dando espacio a la digestión entre comidas",
      "Registro lo que como y cómo me siento",
      "Empiezo a observar mis síntomas digestivos",
      "Empiezo a aplicar las pautas básicas de digestión",
      "Puedo revisar las guías de apoyo si lo necesito",
      "Completo el primer formulario de seguimiento",
    ],
  },
  {
    order: 2,
    label: "Semanas 3-4 · Entendemos qué está pasando",
    items: [
      "Continúo con el mismo plan nutricional",
      "Mantengo el registro diario",
      "Voy entendiendo mejor cómo responde mi digestión",
      "Empiezo a adaptar el menú a mi día a día",
      "Utilizo los recursos (recetas, guías) para adaptarme en el día a día",
      "Tengo mi primera videollamada de revisión",
    ],
  },
  {
    order: 3,
    label: "Semanas 5-6 · Primera revisión y ajustes",
    items: [
      "Tengo mi primera videollamada",
      "Revisamos mi evolución",
      "Entiendo mejor qué está influyendo en mis síntomas",
      "Recibo mi plan nutricional actualizado",
      "Resuelvo dudas que hayan surgido al aplicar el plan",
      "Completo el segundo formulario de seguimiento",
    ],
  },
  {
    order: 4,
    label: "Semanas 7-8 · Seguimos avanzando",
    items: [
      "Aplico el nuevo plan nutricional",
      "Continúo registrando mis síntomas",
      "Voy notando cambios en mi digestión",
      "Sigo entendiendo mejor mi cuerpo",
      "Tengo mi segunda videollamada de revisión",
    ],
  },
  {
    order: 5,
    label: "Semanas 9-10 · Ampliamos la alimentación",
    items: [
      "Continúo introduciendo alimentos de forma progresiva",
      "Mi digestión responde de forma más estable",
      "Mi alimentación es cada vez más amplia",
      "Me siento con más seguridad al comer",
      "Completo el tercer formulario de seguimiento",
    ],
  },
  {
    order: 6,
    label: "Semanas 11-12 · Cierre del proceso",
    items: [
      "Tengo mi sesión final",
      "Reviso todo lo que he avanzado",
      "Entiendo mejor mi digestión",
      "Sé cómo organizar mi alimentación de forma autónoma",
      "Tengo herramientas para seguir sola",
    ],
  },
];

async function main() {
  console.log("Sembrando módulos...");
  const moduleIdByOrder = new Map<number, string>();
  for (const mod of MODULES) {
    const created = await prisma.module.create({
      data: {
        order: mod.order,
        icon: mod.icon,
        title: mod.title,
        description: mod.description,
        lessons: {
          create: mod.lessons.map((lesson, i) => ({
            order: i,
            title: lesson.title,
            videoUrl: lesson.videoUrl,
            body: lesson.body,
          })),
        },
      },
    });
    moduleIdByOrder.set(mod.order, created.id);
  }

  console.log("Sembrando recursos...");
  for (const [i, r] of RESOURCES.entries()) {
    const { moduleOrder, ...rest } = r;
    await prisma.resource.create({
      data: {
        ...rest,
        order: i,
        moduleId: moduleOrder !== undefined ? moduleIdByOrder.get(moduleOrder) : undefined,
      },
    });
  }

  console.log("Sembrando hoja de ruta de 12 semanas...");
  for (const block of WEEK_BLOCKS) {
    await prisma.weekBlock.create({
      data: {
        order: block.order,
        label: block.label,
        items: {
          create: block.items.map((label, i) => ({ order: i, label })),
        },
      },
    });
  }

  console.log("Creando cuenta de coach (Sandra)...");
  const coachPasswordHash = await bcrypt.hash("cambia-esta-clave", 10);
  await prisma.user.create({
    data: {
      name: "Sandra",
      email: "sandra@origendigestivo.local",
      passwordHash: coachPasswordHash,
      role: "COACH",
    },
  });

  console.log("Creando paciente de prueba...");
  const patientPasswordHash = await bcrypt.hash("prueba1234", 10);
  await prisma.user.create({
    data: {
      name: "Paciente de prueba",
      email: "paciente.demo@origendigestivo.local",
      passwordHash: patientPasswordHash,
      role: "PATIENT",
      patientProfile: {
        create: {
          plan: {
            create: {
              actionPlanFirstMonth:
                "Tu plan de acción personalizado se añadirá aquí tras nuestra primera consulta.",
            },
          },
        },
      },
    },
  });

  console.log("Listo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
