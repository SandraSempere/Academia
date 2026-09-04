"use client";

import { useState } from "react";
import Image from "next/image";
import { LeafAccent } from "@/components/leaf-accent";
import {
  SUPERMARKETS,
  PESCADO,
  CONSEJOS,
} from "@/lib/compra-saludable-data";
import { PRODUCTOS, CATEGORIAS_ORDEN } from "@/lib/productos-data";

const TABS = [
  { id: "supermercados", label: "Supermercados" },
  { id: "mercado", label: "Mercado fresco" },
  { id: "consejos", label: "Consejos de compra" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function StoreLogo({
  logo,
  name,
  size,
}: {
  logo: string;
  name: string;
  size: number;
}) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-black/5"
      style={{ width: size, height: size }}
    >
      <Image
        src={logo}
        alt={name}
        fill
        sizes={`${size}px`}
        className="object-contain p-1"
      />
    </span>
  );
}

function ProductoThumb({ nombre, img }: { nombre: string; img: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-black/5 bg-crema">
        <Image
          src={img}
          alt={nombre}
          fill
          sizes="140px"
          className="object-contain p-1"
        />
      </div>
      <p className="text-xs font-medium leading-snug">{nombre}</p>
    </div>
  );
}

export default function CompraSaludablePage() {
  const [tab, setTab] = useState<TabId>("supermercados");
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-2xl border border-black/5 bg-blanco-roto p-6">
        <LeafAccent className="pointer-events-none absolute -right-4 -top-6 h-32 w-24 opacity-70" />
        <h1 className="text-2xl font-semibold">
          Tu compra <span className="text-brand-primary">saludable</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground/70">
          Esto no es una lista de alimentos prohibidos. Es un mapa para
          moverte por el supermercado, el mercado o donde compres
          normalmente, y saber qué mirar sin tener que darle vueltas cada
          vez. Ve a tu sección, aplica el criterio, y listo.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              tab === t.id
                ? "bg-brand-secondary text-blanco-roto"
                : "border border-black/10 text-foreground/70 hover:bg-brand-secondary-soft/40"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "supermercados" && (
        <div className="flex flex-col gap-5">
          <p className="text-sm text-foreground/70">
            Elige una tienda para ver lo que más te puede ayudar, qué
            vigilar, y — cuando lo sé — productos concretos con foto para
            que los reconozcas en el lineal a la primera.
          </p>

          <div className="flex flex-wrap gap-2">
            {SUPERMARKETS.map((s) => (
              <button
                key={s.name}
                onClick={() =>
                  setSelectedStore(selectedStore === s.name ? null : s.name)
                }
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors ${
                  selectedStore === s.name
                    ? "bg-brand-primary text-white"
                    : "border border-black/10 text-foreground/70 hover:bg-brand-primary-soft/40"
                }`}
              >
                <StoreLogo logo={s.logo} name={s.name} size={24} />
                {s.name}
              </button>
            ))}
          </div>

          {selectedStore &&
            (() => {
              const s = SUPERMARKETS.find((x) => x.name === selectedStore)!;
              const productosTienda = PRODUCTOS.filter((p) =>
                p.tiendas.includes(s.name)
              );
              const categoriasTienda = CATEGORIAS_ORDEN.filter((cat) =>
                productosTienda.some((p) => p.categoria === cat)
              );
              return (
                <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
                  <div className="flex items-center gap-3">
                    <StoreLogo logo={s.logo} name={s.name} size={40} />
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-xs text-foreground/60">{s.zona}</p>
                    </div>
                  </div>
                  <p className="mt-3 border-l-2 border-brand-tertiary pl-3 text-sm text-foreground/80">
                    {s.loMejor}
                  </p>
                  <p className="mt-2 border-l-2 border-brand-primary pl-3 text-sm text-foreground/70">
                    {s.queVigilar}
                  </p>

                  {categoriasTienda.length > 0 && (
                    <div className="mt-5 flex flex-col gap-4 border-t border-black/5 pt-4">
                      {categoriasTienda.map((categoria) => (
                        <div key={categoria}>
                          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                            {categoria}
                          </p>
                          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                            {productosTienda
                              .filter((p) => p.categoria === categoria)
                              .map((p) => (
                                <ProductoThumb
                                  key={p.slug}
                                  nombre={p.nombre}
                                  img={p.img}
                                />
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

          <p className="rounded-xl bg-brand-tertiary-soft px-4 py-3 text-sm text-foreground/80">
            Ningún supermercado es &ldquo;el bueno&rdquo; o &ldquo;el
            malo&rdquo;. Lo que cambia tu digestión no es dónde compras, es
            qué eliges dentro de donde compras — y eso lo puedes hacer en
            cualquiera de ellos en cuanto le coges el truco.
          </p>
        </div>
      )}

      {tab === "mercado" && (
        <div className="flex flex-col gap-6">
          <p className="text-sm text-foreground/70">
            El mercado de abastos o los mostradores de fresco del súper
            suelen ser tu mejor opción: producto sin envasar, sin lista de
            ingredientes que leer, y puedes pedir que te lo preparen a tu
            manera.
          </p>

          <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
            <p className="font-semibold">🐟 Pescadería</p>
            <p className="mt-2 rounded-lg bg-brand-secondary-soft/60 px-3 py-2 text-sm text-foreground/80">
              Di siempre para qué lo vas a cocinar (&ldquo;para
              horno&rdquo;, &ldquo;para plancha&rdquo;). Si estás en una
              fase más restrictiva, pide que no lo marinen ni lo preparen
              con ajo o cebolla — tú añades después lo que toleres.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-foreground/50">
                    <th className="pb-2 pr-4">Pescado</th>
                    <th className="pb-2 pr-4">Temporada</th>
                    <th className="pb-2 pr-4">Cómo pedirlo</th>
                    <th className="pb-2">¿Congela?</th>
                  </tr>
                </thead>
                <tbody>
                  {PESCADO.map((p) => (
                    <tr key={p.nombre} className="border-t border-black/5">
                      <td className="py-2 pr-4 font-medium">{p.nombre}</td>
                      <td className="py-2 pr-4 text-foreground/70">
                        {p.temporada}
                      </td>
                      <td className="py-2 pr-4 text-foreground/70">
                        {p.comoPedirlo}
                      </td>
                      <td className="py-2 text-foreground/70">
                        {p.congela}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
            <p className="font-semibold">🥕 Frutería y verdulería</p>
            <p className="mt-2 text-sm text-foreground/70">
              Comprar de temporada suele salir más barato y sabroso, pero
              no es lo que marca si algo te sienta bien o mal — eso lo
              decide el tipo de fruta o verdura y la cantidad, según tu
              pauta actual. El mismo criterio de tu plan te sirve aquí
              igual que en el súper.
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
            <p className="font-semibold">🥩 Carnicería y charcutería</p>
            <p className="mt-2 text-sm text-foreground/70">
              Pide que te quiten la grasa visible si lo prefieres, y elige
              carne fresca en vez de loncheados envasados cuando puedas —
              suelen llevar menos conservantes y aditivos.
            </p>
          </div>
        </div>
      )}

      {tab === "consejos" && (
        <div className="flex flex-col gap-4">
          {CONSEJOS.map((c, i) => (
            <div
              key={c.titulo}
              className="rounded-2xl border border-black/5 bg-blanco-roto p-5"
            >
              <p className="font-semibold">
                {i + 1}. {c.titulo}
              </p>
              <p className="mt-1 text-sm text-foreground/70">{c.texto}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
