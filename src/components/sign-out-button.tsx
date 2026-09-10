"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={async () => {
        // redirect:false + navegación propia — con el redirect automático
        // de next-auth, en producción calculaba mal la URL de vuelta (caía
        // a http://localhost:3000, la de repuesto interna de la librería,
        // en vez del dominio real). Así el navegador decide adónde ir, sin
        // depender de ese cálculo.
        await signOut({ redirect: false });
        window.location.href = "/login";
      }}
      className="text-sm text-foreground/60 hover:text-foreground"
    >
      Cerrar sesión
    </button>
  );
}
