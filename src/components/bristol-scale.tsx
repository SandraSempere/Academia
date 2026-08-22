const TYPES = [
  {
    n: 1,
    label: "Trozos duros y separados",
    detail: "Como bolitas o nueces, difíciles de expulsar. Estreñimiento severo.",
    color: "#8a6a4a",
  },
  {
    n: 2,
    label: "Forma de salchicha, con bultos",
    detail: "Compacto y grumoso. Estreñimiento leve.",
    color: "#96774f",
  },
  {
    n: 3,
    label: "Como una salchicha, con grietas",
    detail: "Grietas en la superficie. Normal.",
    color: "#a4835a",
  },
  {
    n: 4,
    label: "Lisa y blanda, como una serpiente",
    detail: "Forma ideal. Normal.",
    color: "#a68a63",
  },
  {
    n: 5,
    label: "Trozos blandos de bordes definidos",
    detail: "Se expulsan con facilidad. Puede faltar fibra.",
    color: "#b89a72",
  },
  {
    n: 6,
    label: "Trozos blandos y esponjosos",
    detail: "Bordes irregulares, pastoso. Tendencia a diarrea.",
    color: "#c7ad82",
  },
  {
    n: 7,
    label: "Totalmente líquida",
    detail: "Sin trozos sólidos. Diarrea.",
    color: "#d9c39a",
  },
];

// Referencia esquemática propia de la Escala de Bristol (no es una foto ni la
// reproducción de ningún gráfico existente) para que la paciente identifique
// su tipo al rellenar el formulario.
export function BristolScale() {
  return (
    <div className="rounded-xl border border-black/5 bg-crema p-3">
      <p className="mb-2 text-xs font-medium text-foreground/60">
        Escala de Bristol — guía de referencia
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {TYPES.map((t) => (
          <div key={t.n} className="flex items-center gap-2 rounded-lg bg-blanco-roto p-2">
            <svg viewBox="0 0 48 24" className="h-6 w-12 shrink-0" aria-hidden="true">
              {t.n === 1 && (
                <>
                  <circle cx="10" cy="12" r="6" fill={t.color} />
                  <circle cx="24" cy="12" r="6" fill={t.color} />
                  <circle cx="38" cy="12" r="6" fill={t.color} />
                </>
              )}
              {t.n === 2 && (
                <path d="M4 12 Q10 2 16 12 Q22 22 28 12 Q34 2 40 12 Q42 14 40 16 Q34 24 28 16 Q22 8 16 16 Q10 24 4 16 Q2 14 4 12 Z" fill={t.color} />
              )}
              {t.n === 3 && (
                <>
                  <rect x="4" y="8" width="40" height="8" rx="4" fill={t.color} />
                  <line x1="14" y1="8" x2="12" y2="16" stroke="#7a5f42" strokeWidth="1" />
                  <line x1="24" y1="8" x2="26" y2="16" stroke="#7a5f42" strokeWidth="1" />
                  <line x1="34" y1="8" x2="32" y2="16" stroke="#7a5f42" strokeWidth="1" />
                </>
              )}
              {t.n === 4 && <rect x="4" y="9" width="40" height="6" rx="3" fill={t.color} />}
              {t.n === 5 && (
                <>
                  <ellipse cx="12" cy="12" rx="7" ry="5" fill={t.color} />
                  <ellipse cx="26" cy="12" rx="7" ry="5" fill={t.color} />
                  <ellipse cx="40" cy="12" rx="5" ry="4" fill={t.color} />
                </>
              )}
              {t.n === 6 && (
                <path d="M4 12 Q6 6 12 9 Q16 4 20 10 Q24 5 28 11 Q32 6 36 10 Q40 7 44 12 Q40 18 34 15 Q30 19 26 14 Q22 18 18 13 Q14 17 9 14 Q5 17 4 12 Z" fill={t.color} />
              )}
              {t.n === 7 && (
                <path d="M4 10 Q10 14 16 10 Q22 14 28 10 Q34 14 40 10 Q42 12 40 14 Q34 18 28 14 Q22 18 16 14 Q10 18 4 14 Q2 12 4 10 Z" fill={t.color} opacity="0.8" />
              )}
            </svg>
            <div className="text-xs">
              <p className="font-medium">Tipo {t.n} · {t.label}</p>
              <p className="text-foreground/60">{t.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
