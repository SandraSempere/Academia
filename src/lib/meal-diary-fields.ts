// Manifiesto único del "Diario de comidas y síntomas" — misma estructura que
// el Google Sheet real de Sandra (12 pestañas, una por semana, con una fila
// por día: comidas + digestión de cada una + baño + observaciones). Lo usan
// tanto el formulario de la paciente como la vista de solo lectura de la
// coach, para no duplicar las preguntas en dos sitios.

export const WEEKS = Array.from({ length: 12 }, (_, i) => i + 1);

export const DAYS: { day: number; label: string }[] = [
  { day: 1, label: "Lunes" },
  { day: 2, label: "Martes" },
  { day: 3, label: "Miércoles" },
  { day: 4, label: "Jueves" },
  { day: 5, label: "Viernes" },
  { day: 6, label: "Sábado" },
  { day: 7, label: "Domingo" },
];

export type MealDiaryFieldId =
  | "breakfast"
  | "breakfastDigestion"
  | "lunch"
  | "lunchDigestion"
  | "dinner"
  | "dinnerDigestion"
  | "bathroom"
  | "notes";

export type ColorOption = { value: string; label: string; color: string };

// Mismos desplegables de color que Sandra tiene en su Sheet real.
export const DIGESTION_OPTIONS: ColorOption[] = [
  { value: "bien", label: "Bien", color: "#CFE8D6" }, // verde
  { value: "hinchada", label: "Hinchada", color: "#FBE7B0" }, // amarillo
  { value: "muy_hinchada", label: "Muy hinchada", color: "#F3C3BC" }, // rojo
];

export const BATHROOM_OPTIONS: ColorOption[] = [
  { value: "si_bien", label: "Sí, bien", color: "#CFE8D6" }, // verde
  { value: "si_regular", label: "Sí, pero regular", color: "#FBE7B0" }, // amarillo
  { value: "si_mal", label: "Sí, pero mal", color: "#F6CFA0" }, // naranja
  { value: "no", label: "No", color: "#F3C3BC" }, // rojo
];

export type MealDiaryFieldDef = {
  id: MealDiaryFieldId;
  label: string;
  type: "text" | "textarea" | "select";
  options?: ColorOption[];
};

export const MEAL_DIARY_FIELDS: MealDiaryFieldDef[] = [
  { id: "breakfast", label: "Desayuno", type: "text" },
  { id: "breakfastDigestion", label: "Digestión", type: "select", options: DIGESTION_OPTIONS },
  { id: "lunch", label: "Comida", type: "text" },
  { id: "lunchDigestion", label: "Digestión", type: "select", options: DIGESTION_OPTIONS },
  { id: "dinner", label: "Cena", type: "text" },
  { id: "dinnerDigestion", label: "Digestión", type: "select", options: DIGESTION_OPTIONS },
  { id: "bathroom", label: "Baño", type: "select", options: BATHROOM_OPTIONS },
  { id: "notes", label: "Observaciones generales del día", type: "textarea" },
];

export type MealDiaryEntryData = Partial<Record<MealDiaryFieldId, string | null>>;

export function hasAnyValue(entry: MealDiaryEntryData | undefined) {
  if (!entry) return false;
  return MEAL_DIARY_FIELDS.some((f) => entry[f.id]);
}
