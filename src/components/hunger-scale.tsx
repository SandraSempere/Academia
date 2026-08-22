// Referencia esquemática propia de la escala de hambre y saciedad (1-10) del
// PDF "Cómo comer, no solo qué comer" — barra de color, no una foto ni copia
// de ningún gráfico existente.
export function HungerScale() {
  return (
    <div className="rounded-xl border border-black/5 bg-crema p-3">
      <p className="mb-2 text-xs font-medium text-foreground/60">
        Escala de hambre y saciedad — ¿cuánta hambre tengo ahora mismo?
      </p>
      <div className="flex h-4 w-full overflow-hidden rounded-full">
        <div className="flex-[2] bg-brand-primary" />
        <div className="flex-[2] bg-brand-secondary-soft" />
        <div className="flex-[2] bg-brand-tertiary" />
        <div className="flex-[2] bg-brand-secondary-soft" />
        <div className="flex-[2] bg-brand-primary" />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-foreground/60">
        <span>1-2 · Hambre voraz</span>
        <span>6-7 · Zona ideal</span>
        <span>8-10 · Llenazo</span>
      </div>
      <p className="mt-2 text-xs text-foreground/60">
        Llegar a la mesa voraz (1-2) te hace comer rápido; comer hasta el 9-10
        garantiza pesadez. No es para controlarte, es para escucharte. Con dos
        semanas de práctica sale solo.
      </p>
    </div>
  );
}
