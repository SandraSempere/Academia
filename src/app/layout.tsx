import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

// Autoalojadas en vez de next/font/google: el build de Railway dejó de
// poder llegar a Google Fonts en el momento de compilar (fallaba con
// "Module not found" en todas las variantes), y next/font/google necesita
// esa conexión durante el build. Los .woff2 son los mismos que servía
// Google para el subset latin (única familia usada en la app) — Montserrat
// es una fuente variable, así que un único archivo cubre 600 y 700.
const montserrat = localFont({
  src: "../fonts/montserrat-var-latin.woff2",
  variable: "--font-montserrat",
  weight: "600 700",
  display: "swap",
});

const lato = localFont({
  src: [
    { path: "../fonts/lato-400-latin.woff2", weight: "400" },
    { path: "../fonts/lato-700-latin.woff2", weight: "700" },
  ],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Origen Digestivo · Academia",
  description: "Tu espacio de acompañamiento digestivo",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Origen Digestivo",
  },
};

export const viewport: Viewport = {
  themeColor: "#e8a7a1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${montserrat.variable} ${lato.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
