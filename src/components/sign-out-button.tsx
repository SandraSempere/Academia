"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm text-foreground/60 hover:text-foreground"
    >
      Cerrar sesión
    </button>
  );
}
