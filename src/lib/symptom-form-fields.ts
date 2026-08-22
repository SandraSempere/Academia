// Definición de campos del "Formulario extendido de síntomas", tal cual el
// PDF real que Sandra usaba (7 páginas). Los campos de PERSONAL_FIELDS se
// guardan como columnas propias de SymptomForm; el resto vive en `answers`
// (JSON pregunta -> respuesta), agrupado por secciones solo para la UI.

export type FieldType = "text" | "textarea" | "number" | "select" | "checkboxes";

export type FieldDef = {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
};

export const PERSONAL_FIELDS: FieldDef[] = [
  { id: "fullName", label: "Nombre y apellidos", type: "text" },
  { id: "dni", label: "DNI", type: "text" },
  { id: "birthDate", label: "Fecha de nacimiento", type: "text" },
  { id: "phone", label: "Teléfono", type: "text" },
  { id: "email", label: "Email", type: "text" },
  { id: "address", label: "Dirección", type: "text" },
  { id: "postalCode", label: "Código postal", type: "text" },
  { id: "city", label: "Ciudad", type: "text" },
  { id: "age", label: "Edad", type: "number" },
  { id: "height", label: "Altura (cm)", type: "number" },
  { id: "weight", label: "Peso (kg)", type: "number" },
  { id: "occupation", label: "Ocupación", type: "text" },
  { id: "consultReason", label: "Motivo principal de la consulta", type: "textarea" },
];

export type FieldSection = {
  title: string;
  fields: FieldDef[];
};

const SI_NO = ["Sí", "No"];
const SI_NO_A_VECES = ["Sí", "No", "A veces (a ampliar en consulta)"];

export const SECTIONS: FieldSection[] = [
  {
    title: "Sobre ti",
    fields: [
      { id: "comoConociste", label: "¿Cómo me has conocido?", type: "select", options: ["Instagram", "Facebook", "Google", "Mi web", "Recomendación de alguien"] },
      { id: "motivacion", label: "Nivel de motivación para el cambio de hábitos o introducción de cosas nuevas", type: "select", options: ["Muy motivad@", "Motivad@", "Poco Motivad@"] },
    ],
  },
  {
    title: "Hábitos",
    fields: [
      { id: "comeEnTrabajo", label: "¿Comes en el trabajo?", type: "select", options: SI_NO },
      { id: "fumas", label: "¿Fumas?", type: "select", options: ["Sí", "No", "A veces"] },
      { id: "alcohol", label: "¿Bebes alcohol?", type: "text" },
      { id: "cafe", label: "¿Bebes café?", type: "select", options: ["Sí, 1 café al día", "Sí, 2 cafés al día", "Sí, más de 2 cafés al día", "No"] },
      { id: "cocinar", label: "¿Te gusta cocinar?", type: "select", options: ["Sí, mucho", "Sí, pero cosas sencillas", "No"] },
      { id: "deporte", label: "¿Realizas deporte?", type: "text" },
      { id: "antibioticos", label: "¿Has tomado muchos antibióticos?", type: "text" },
    ],
  },
  {
    title: "Salud general",
    fields: [
      { id: "infeccionesRecurrentes", label: "¿Sufres infecciones recurrentes?", type: "select", options: ["Sí", "No", "He tenido, pero ahora no"] },
      { id: "medicacion", label: "¿Tomas algún medicamento? ¿Alguna suplementación?", type: "textarea" },
      { id: "patologia", label: "¿Tienes alguna patología diagnosticada?", type: "textarea" },
    ],
  },
  {
    title: "Síntomas digestivos",
    fields: [
      { id: "distension", label: "¿Sufres distensión abdominal? (hinchazón de barriga)", type: "select", options: SI_NO_A_VECES },
      { id: "ardor", label: "¿Sufres ardor/acidez, en ayunas o tras las comidas?", type: "select", options: ["Sí, en ayunas", "Sí, tras las comidas (1-2h después)", "No", "A veces (a ampliar en consulta)"] },
      { id: "histaminergia", label: "¿Sufres síntomas de histaminergia? (rinitis, eccemas, rosácea, granitos en la piel, alergias, intolerancias...)", type: "select", options: SI_NO_A_VECES },
      { id: "diarreaEstrenimiento", label: "¿Sufres de diarrea o estreñimiento?", type: "select", options: SI_NO_A_VECES },
      { id: "colorHeces", label: "¿De qué color son tus heces?", type: "text" },
      { id: "pegajosas", label: "¿Se \"pegan\" en el váter tus heces?", type: "select", options: SI_NO },
      { id: "mocoSangre", label: "¿Tienen moco y/o sangre tus heces?", type: "select", options: ["Sí", "No", "En alguna ocasión sí"] },
      { id: "tipoHeces", label: "¿Qué tipo o tipos de heces son las que más presentas? (escala de Bristol)", type: "text" },
      { id: "trozosComida", label: "¿Se observan trozos de comida en tus heces? (vegetales, semillas, quinoa...)", type: "select", options: SI_NO },
      { id: "incontinencia", label: "¿Sufres incontinencia para ir al baño? (diarrea u orina)", type: "select", options: SI_NO_A_VECES },
      { id: "gases", label: "¿Sufres de gases con dolor y flatulencias?", type: "select", options: SI_NO_A_VECES },
      { id: "digestionesPesadas", label: "¿Tienes digestiones muy pesadas?", type: "select", options: SI_NO_A_VECES },
      { id: "borborigmos", label: "¿Sufres borborigmos? (ruidos abdominales)", type: "select", options: SI_NO_A_VECES },
      { id: "nauseas", label: "¿Sufres náuseas o vómitos?", type: "select", options: SI_NO_A_VECES },
      { id: "viajesTropicales", label: "¿Has viajado a algún país tropical y has notado empeoramiento o aparición de síntomas digestivos?", type: "select", options: SI_NO },
      { id: "intolerancias", label: "¿Tienes alguna intolerancia alimentaria o notas algunos alimentos que te sientan peor? ¿A qué?", type: "textarea" },
      { id: "alergia", label: "¿Tienes alguna alergia?", type: "select", options: SI_NO },
      { id: "alergiaDetalle", label: "En caso afirmativo, ¿a qué tienes alergia?", type: "text" },
    ],
  },
  {
    title: "Preferencias alimentarias",
    fields: [
      { id: "frutasGustan", label: "Frutas que más te gustan", type: "text" },
      { id: "frutasNoGustan", label: "Frutas que no te gustan", type: "text" },
      { id: "verdurasGustan", label: "Verduras que más te gustan", type: "text" },
      { id: "verdurasNoGustan", label: "Verduras que no te gustan", type: "text" },
      { id: "proteinas", label: "Marca qué comes de proteínas", type: "checkboxes", options: ["Pollo", "Pavo", "Cerdo", "Ternera", "Cordero", "Conejo", "Huevos", "Pescado", "Marisco", "Conservas de pescado/marisco"] },
      { id: "grasas", label: "Marca qué comes de grasas", type: "checkboxes", options: ["Aguacate", "Leche de coco (cocinar)", "Coco", "Aceites", "Quesos", "Aceitunas", "Frutos secos y semillas"] },
      { id: "hidratos", label: "Marca qué comes de hidratos", type: "checkboxes", options: ["Pan", "Patata", "Boniato", "Yuca", "Plátano macho", "Algo sin gluten", "Pasta", "Quinoa", "Legumbres", "Fideos", "Arroz (basmati/blanco/integral)"] },
      { id: "pescadoBlanco", label: "¿Comes pescado blanco? (lubina, dorada, gallo, lenguado, pescadilla, merluza...)", type: "select", options: ["Sí", "No", "Algunos"] },
      { id: "pescadoAzul", label: "¿Comes pescado azul? (salmón, sardinas, boquerones, trucha, atún, emperador, caballa...)", type: "select", options: ["Sí", "No", "Algunos"] },
      { id: "comidaFavorita", label: "Comida favorita", type: "text" },
      { id: "azucarEdulcorantes", label: "¿Usas azúcar o edulcorantes?", type: "text" },
      { id: "postre", label: "¿Comes postre después de las comidas?", type: "text" },
      { id: "conPan", label: "¿Comes con pan?", type: "text" },
      { id: "picarEntreHoras", label: "¿Sueles picar entre horas?", type: "text" },
      { id: "tiempoComiendo", label: "¿Cuánto tardas en comer?", type: "text" },
      { id: "bebidaComidas", label: "¿Bebes durante las comidas? ¿Qué bebes?", type: "text" },
      { id: "hambreComidas", label: "¿Llegas con hambre a las comidas principales?", type: "text" },
    ],
  },
  {
    title: "Estilo de vida",
    fields: [
      { id: "estres", label: "¿Sufres estrés?", type: "select", options: ["Sí", "No", "No lo sé"] },
      { id: "sueno", label: "¿Duermes 7-8h de sueño reparador?", type: "select", options: ["Sí", "No", "No lo sé", "A veces"] },
      { id: "otrosSintomas", label: "¿Tienes otros síntomas que te preocupan? Puedes comentarlo aquí", type: "textarea" },
    ],
  },
  {
    title: "Diario de comidas · últimas 48h (día 1)",
    fields: [
      { id: "d1HoraLevantas", label: "Hora a la que te levantas", type: "text" },
      { id: "d1HoraAcuestas", label: "Hora a la que te acuestas", type: "text" },
      { id: "d1Desayuno", label: "Desayuno (alimentos, técnica culinaria y cantidad aproximada)", type: "textarea" },
      { id: "d1Almuerzo", label: "Almuerzo", type: "textarea" },
      { id: "d1Comida", label: "Comida", type: "textarea" },
      { id: "d1Merienda", label: "Merienda", type: "textarea" },
      { id: "d1Cena", label: "Cena", type: "textarea" },
      { id: "d1Comentarios", label: "Comentarios", type: "textarea" },
    ],
  },
  {
    title: "Diario de comidas · últimas 48h (día 2)",
    fields: [
      { id: "d2HoraLevantas", label: "Hora a la que te levantas", type: "text" },
      { id: "d2HoraAcuestas", label: "Hora a la que te acuestas", type: "text" },
      { id: "d2Desayuno", label: "Desayuno (alimentos, técnica culinaria y cantidad aproximada)", type: "textarea" },
      { id: "d2Almuerzo", label: "Almuerzo", type: "textarea" },
      { id: "d2Comida", label: "Comida", type: "textarea" },
      { id: "d2Merienda", label: "Merienda", type: "textarea" },
      { id: "d2Cena", label: "Cena", type: "textarea" },
      { id: "d2Comentarios", label: "Comentarios", type: "textarea" },
    ],
  },
];
