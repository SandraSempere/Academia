import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Pensado sobre todo para "Adjunta aquí tus pruebas médicas": una
      // paciente puede subir muchas fotos de móvil a la vez (p.ej. 15-20
      // fotos de analíticas en papel), y 30mb se quedaba corto para eso.
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
