type LeafAccentProps = {
  className?: string;
  flip?: boolean;
};

// Ramita decorativa de trazo fino, en los tonos verdes de la marca — estilo
// dibujo de línea suelto, como los doodles de hojas de tus materiales de
// marca, en vez de formas rellenas.
export function LeafAccent({ className, flip }: LeafAccentProps) {
  return (
    <svg
      viewBox="0 0 100 150"
      className={className}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M52 145 C48 110 54 75 46 40 C42 22 48 10 44 2"
        stroke="var(--color-verde-oscuro)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M50 118 Q34 108 24 112 Q32 122 50 122 Q32 126 22 120"
        stroke="var(--color-verde-salvia)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path
        d="M47 90 Q66 82 76 86 Q68 96 48 94 Q68 98 78 92"
        stroke="var(--color-verde-salvia)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path
        d="M45 62 Q28 54 19 58 Q26 67 45 66 Q27 71 17 65"
        stroke="var(--color-verde-oscuro)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
      <path
        d="M44 33 Q56 24 65 27 Q58 35 43 34 Q57 38 66 32"
        stroke="var(--color-rosa-terracota)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.65"
      />
      <circle cx="44" cy="4" r="2.5" fill="var(--color-rosa-terracota)" opacity="0.6" />
    </svg>
  );
}
