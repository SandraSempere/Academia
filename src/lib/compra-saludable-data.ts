export type Supermarket = {
  name: string;
  badge: string;
  logo: string;
  zona: string;
  loMejor: string;
  queVigilar: string;
};

export const SUPERMARKETS: Supermarket[] = [
  {
    name: "Mercadona",
    badge: "MER",
    logo: "/logos/mercadona.png",
    zona: "Nacional",
    loMejor:
      "Hacendado tiene bastantes básicos con lista de ingredientes corta, y la pescadería/frutería es un buen punto de partida en casi cualquier barrio.",
    queVigilar:
      "Su gama \"sin azúcar\" (cereales, chocolates, cacao soluble) suele llevar achicoria o inulina añadida — léela antes de asumir que es la opción más suave para tu digestión.",
  },
  {
    name: "Carrefour",
    badge: "CAR",
    logo: "/logos/carrefour.png",
    zona: "Nacional",
    loMejor:
      "La gama Carrefour Bio es de las más amplias del país (más de 400 productos ecológicos), y las tiendas grandes suelen tener buena variedad en pescadería y carnicería.",
    queVigilar:
      "\"Bio\" es sobre el método de cultivo, no sobre si un producto es fácil de digerir — sigue leyendo ingredientes igual que en cualquier otra marca.",
  },
  {
    name: "Lidl",
    badge: "LID",
    logo: "/logos/lidl.png",
    zona: "Nacional",
    loMejor:
      "Formato pequeño y menos marcas entre las que elegir, lo que en la práctica ayuda a no perderse. Su gama Bio y las semanas de producto de temporada suelen tener buena relación calidad-precio.",
    queVigilar:
      "Al tener menos variedad, a veces faltará una alternativa concreta que sí encuentras en un súper más grande — no pasa nada por combinar más de un sitio.",
  },
  {
    name: "Aldi",
    badge: "ALD",
    logo: "/logos/aldi.png",
    zona: "Nacional",
    loMejor:
      "Formato descuento con pocas referencias por categoría, lo que suele traducirse en decisiones más rápidas y menos ultraprocesados \"de relleno\" en el lineal.",
    queVigilar:
      "Menos variedad también significa menos alternativas sin gluten/sin lactosa específicas si las necesitas — revisa antes de dar por hecho que estará.",
  },
  {
    name: "Alcampo",
    badge: "ALC",
    logo: "/logos/alcampo.png",
    zona: "Nacional",
    loMejor:
      "Al ser hipermercados, suelen tener mercado de frescos amplio (pescadería, carnicería, frutería) donde comprar sin envasar, y gama Auchan Bio.",
    queVigilar:
      "Las tiendas grandes invitan a comprar de más — si te ayuda, ve con lista para no acabar con más ultraprocesados de los que pensabas coger.",
  },
  {
    name: "Eroski",
    badge: "ERO",
    logo: "/logos/eroski.png",
    zona: "Nacional (fuerte en norte)",
    loMejor:
      "Una de las gamas propias más amplias en producto sin gluten (línea Sannia, más de 550 referencias) — útil si además de SIBO tienes otra intolerancia diagnosticada.",
    queVigilar:
      "\"Sin gluten\" o \"sin lactosa\" no es sinónimo de mejor para SIBO: son gamas pensadas para alergias e intolerancias concretas, se leen igual que el resto.",
  },
  {
    name: "Consum",
    badge: "CON",
    logo: "/logos/consum.png",
    zona: "Este y sureste",
    loMejor:
      "Cooperativa con buena sección de fruta y verdura de proximidad, y gama Consum Veggie si buscas alternativas vegetales con ingredientes claros.",
    queVigilar:
      "Como en cualquier gama \"veggie\" o \"plant-based\", revisa el aditivo espesante o el azúcar añadido antes de asumir que es la opción más digestiva.",
  },
  {
    name: "Dia",
    badge: "DIA",
    logo: "/logos/dia.png",
    zona: "Nacional",
    loMejor:
      "Buena opción si el precio es lo que más te limita — sigue siendo posible comer bien aquí siguiendo el mismo criterio de siempre.",
    queVigilar:
      "La sección de frescos suele ser más reducida que en un hiper, así que aquí conviene mirar más las etiquetas de los envasados, porque hay menos alternativa fresca directa.",
  },
  {
    name: "Ahorramás",
    badge: "AHO",
    logo: "/logos/ahorramas.png",
    zona: "Madrid y Castilla",
    loMejor:
      "Su seña de identidad son los mostradores de fresco (carnicería, pescadería, pollería, obrador) — de las mejores opciones de la zona centro para comprar sin envasar.",
    queVigilar:
      "Su marca propia (Alipende) es más pequeña que la de las grandes cadenas — para envasados puede que necesites combinar con otra marca.",
  },
  {
    name: "Spar",
    badge: "SPA",
    logo: "/logos/spar.png",
    zona: "Nacional (franquicias)",
    loMejor:
      "Al ser tiendas de proximidad llevadas por franquiciados distintos, muchas mantienen buen trato con proveedores locales de fresco.",
    queVigilar:
      "La oferta varía bastante de una tienda Spar a otra según quién la lleve — el criterio que aplicas no cambia, pero no des por hecho que todas tienen lo mismo.",
  },
  {
    name: "Supeco",
    badge: "SUP",
    logo: "/logos/supeco.png",
    zona: "Nacional (marca de Carrefour)",
    loMejor:
      "Formato almacén con precios bajos en básicos (aceite, huevos, leche) — útil para la despensa base sin disparar el gasto.",
    queVigilar:
      "Formato descuento orientado a volumen: hay menos fresco de calidad y más pasillo de envasado, así que aquí lee etiquetas con más cuidado que de costumbre.",
  },
  {
    name: "Covirán",
    badge: "COV",
    logo: "/logos/coviran.png",
    zona: "Andalucía y zonas rurales",
    loMejor:
      "Cooperativa de proximidad con casi 1.400 referencias propias y una gama saludable en crecimiento (huevos ecológicos, bebidas vegetales, arroz integral) — útil en pueblos donde no llega una gran cadena.",
    queVigilar:
      "Al ser tiendas pequeñas de barrio o pueblo, la variedad de un local a otro cambia bastante — el mismo criterio de siempre te sirve igual.",
  },
  {
    name: "Gadis",
    badge: "GAD",
    logo: "/logos/gadis.png",
    zona: "Galicia",
    loMejor:
      "Fuerte en producto de proximidad y frescos gallegos, con gama propia Eliges y cerca de 300 productos bio/ecológicos en lineal.",
    queVigilar:
      "Fuera de Galicia no tienes esta opción — si viajas o te mudas, el criterio (no la cadena concreta) es lo que te acompaña.",
  },
  {
    name: "BM Supermercados",
    badge: "BM",
    logo: "/logos/bm.png",
    zona: "País Vasco, Navarra, La Rioja y Madrid",
    loMejor:
      "Gama ecológica propia (Eliges Eco) y una sección \"sin gluten\" bien surtida — en Madrid, más de 100 referencias específicas.",
    queVigilar:
      "Igual que con Eroski: sin gluten no equivale a antiSIBO, es para celiaquía/sensibilidad al gluten. Léelo con el mismo criterio que el resto.",
  },
  {
    name: "Family Cash",
    badge: "FC",
    logo: "/logos/familycash.png",
    zona: "Comunidad Valenciana",
    loMejor:
      "Formato grande con precios estables (sin depender de ofertas puntuales) y buena sección de frescos, charcutería y congelado.",
    queVigilar:
      "Al ser tiendas muy grandes tipo almacén, es fácil que se cuelen más productos de los previstos en el carro — lista antes de entrar, si te ayuda.",
  },
  {
    name: "El Corte Inglés / Supercor",
    badge: "ECI",
    logo: "/logos/eci.png",
    zona: "Nacional (urbano)",
    loMejor:
      "De las secciones \"sin gluten\" y \"sin lactosa\" más completas del país, y mercado de frescos muy amplio si te queda cerca.",
    queVigilar:
      "Precio más alto que la media — no es necesario comprar aquí para comer bien, es simplemente una opción más si te resulta cómoda.",
  },
  {
    name: "Veritas",
    badge: "VER",
    logo: "/logos/veritas.png",
    zona: "Cataluña, Madrid, Valencia (tienda física)",
    loMejor:
      "Supermercado 100% ecológico: todo el lineal cumple ya el criterio de \"ingredientes reconocibles\", con buena variedad sin gluten y sin lactosa.",
    queVigilar:
      "Precio bastante más alto que un súper convencional — útil para lo que no encuentras en otro sitio, no hace falta hacer aquí toda la compra.",
  },
  {
    name: "Naturitas",
    badge: "NAT",
    logo: "/logos/naturitas.png",
    zona: "Online (nacional)",
    loMejor:
      "Tienda online con gran variedad de ecológico, sin gluten y superalimentos — muchos de los productos que ves en la pestaña \"Productos\" se encuentran aquí.",
    queVigilar:
      "Al comprar sin ver el producto físico, revisa igualmente la lista de ingredientes en la ficha antes de pedir.",
  },
  {
    name: "Herbolario Navarro",
    badge: "HN",
    logo: "/logos/herbolarionavarro.png",
    zona: "Online (nacional)",
    loMejor:
      "Herbolario online con buena selección de trigo sarraceno (pasta, pan, tostadas) y caldos de huesos — útil para lo que no encuentras en el súper habitual.",
    queVigilar:
      "Igual que en cualquier herbolario: \"natural\" no es sinónimo de digestivo. Revisa ingredientes con el mismo criterio de siempre.",
  },
  {
    name: "Levadura Madre",
    badge: "LM",
    logo: "/logos/levaduramadre.png",
    zona: "Nacional (más de 150 panaderías: fuerte en Madrid y Barcelona, presente en Valencia, Alicante, Andalucía, País Vasco...) + online",
    loMejor:
      "Panadería especializada en masa madre, con una hogaza 100% trigo sarraceno de verdad (no un pan normal con un toque de sarraceno) — de las pocas opciones de pan de barra real sin gluten. Tienen buscador de tiendas en su web para ver si te queda cerca.",
    queVigilar:
      "Precio de panadería artesana, más alto que un pan de molde de súper — para el día a día puedes combinarlo con otras opciones envasadas.",
  },
  {
    name: "Bonpreu",
    badge: "BON",
    logo: "/logos/bonpreu.png",
    zona: "Cataluña",
    loMejor:
      "Buena sección ecológica propia y bastante marca de nicho (Natruly, Le Pain des Fleurs, Santiveri) en el mismo lineal — si vives en Cataluña, es una opción cómoda para no depender solo de tiendas online.",
    queVigilar:
      "Fuera de Cataluña no tienes esta opción — el criterio (no la cadena concreta) es lo que te acompaña si te mudas o viajas.",
  },
];

export type PescadoRow = {
  nombre: string;
  temporada: string;
  comoPedirlo: string;
  congela: string;
};

export const PESCADO: PescadoRow[] = [
  { nombre: "Merluza", temporada: "Todo el año", comoPedirlo: "En filetes, sin rebozar. Horno o plancha.", congela: "Muy bien" },
  { nombre: "Lubina / dorada", temporada: "Todo el año (mejor salvaje en temporada)", comoPedirlo: "Entera y limpia, al horno o a la sal.", congela: "Bien" },
  { nombre: "Rape", temporada: "Todo el año", comoPedirlo: "En rodajas, para guiso o plancha.", congela: "Bien" },
  { nombre: "Gallo", temporada: "Todo el año", comoPedirlo: "Filetes finos, plancha rápida.", congela: "Bien" },
  { nombre: "Bacalao fresco", temporada: "Invierno", comoPedirlo: "Lomos, al horno o en salsa.", congela: "Muy bien" },
  { nombre: "Sardinas", temporada: "Junio–septiembre", comoPedirlo: "Pide que las limpien. Plancha o al horno.", congela: "Bien" },
  { nombre: "Boquerones / anchoas", temporada: "Primavera–verano", comoPedirlo: "Fritos o en vinagre, sin rebozado grueso.", congela: "Regular (mejor frescos)" },
  { nombre: "Caballa / verdel", temporada: "Primavera–verano", comoPedirlo: "Plancha o al horno con limón.", congela: "Bien" },
  { nombre: "Salmón", temporada: "Todo el año", comoPedirlo: "Lomos sin espinas, horno o papillote.", congela: "Muy bien" },
  { nombre: "Gambas / langostinos", temporada: "Todo el año", comoPedirlo: "Pide que te los pelen si vas con prisa.", congela: "Crudos, pelados" },
  { nombre: "Mejillones", temporada: "Sept–abril (veda en verano)", comoPedirlo: "Al vapor, sin sofrito de ajo/cebolla si estás en fase restrictiva.", congela: "Cocidos, sin valva" },
];

export type PantryCategory = {
  categoria: string;
  items: { nombre: string; porQue: string }[];
};

export const DESPENSA: PantryCategory[] = [
  {
    categoria: "Aceites y grasas",
    items: [
      { nombre: "Aceite de oliva virgen extra", porQue: "Grasa base para casi todo, sin ingredientes añadidos que vigilar." },
      { nombre: "Aceite en spray", porQue: "Práctico para no pasarte de cantidad al cocinar sin sofreír de más." },
    ],
  },
  {
    categoria: "Cereales y almidones",
    items: [
      { nombre: "Arroz (blanco o integral, según tu pauta)", porQue: "Base neutra y bien tolerada en la mayoría de fases." },
      { nombre: "Avena certificada sin gluten (si la toleras)", porQue: "Desayuno rápido; comprueba que no lleve inulina añadida." },
      { nombre: "Patata y boniato", porQue: "Fuente de energía sencilla, sin etiqueta que leer." },
    ],
  },
  {
    categoria: "Proteína de bote y congelador",
    items: [
      { nombre: "Atún y caballa en conserva (al natural o en AOVE)", porQue: "Proteína lista sin necesidad de fresco cada día." },
      { nombre: "Pescado congelado en filetes sueltos", porQue: "Te permite coger solo la ración que necesitas." },
      { nombre: "Huevos", porQue: "Comodín de proteína completa, sin lista de ingredientes." },
    ],
  },
  {
    categoria: "Condimentos que no suelen dar problema",
    items: [
      { nombre: "Aceite con infusión de ajo (sin el ajo)", porQue: "Da sabor sin el fructano del ajo entero." },
      { nombre: "Hierbas aromáticas frescas o secas", porQue: "Sabor sin fermentables — perejil, cebollino (la parte verde), albahaca." },
      { nombre: "Sal, pimienta, pimentón, cúrcuma", porQue: "Especias puras, sin mezcla con extractos de cebolla/ajo en polvo." },
    ],
  },
];

export type ConsejoCompra = {
  titulo: string;
  texto: string;
};

export const CONSEJOS: ConsejoCompra[] = [
  {
    titulo: "Empieza por el perímetro de la tienda",
    texto: "Fruta, verdura, carne, pescado, huevos y lácteos suelen estar en los laterales. Los pasillos centrales son donde vive la mayoría de los ultraprocesados — no hay que evitarlos, pero sí ir con más criterio ahí.",
  },
  {
    titulo: "Mira la lista de ingredientes, no el frontal del envase",
    texto: "\"Sin azúcar\", \"light\" o \"rico en fibra\" no dice nada de si te va a sentar bien. Cuanto más corta y reconocible sea la lista, mejor.",
  },
  {
    titulo: "Ojo con \"sin azúcar añadido\"",
    texto: "Muchas veces se sustituye por inulina, achicoria o polialcoholes (sorbitol, xilitol, manitol...) para mantener el sabor. En digestiones sensibles pueden dar más hinchazón que el azúcar que sustituyen. No es que sean \"malos\": es que conviene identificarlos.",
  },
  {
    titulo: "\"Sin gluten\" o \"sin lactosa\" no es sinónimo de más digestivo",
    texto: "Son gamas pensadas para alergias e intolerancias específicas, no para SIBO. Te pueden servir de apoyo, pero se leen igual que el resto.",
  },
  {
    titulo: "Si tienes dudas, hazle una foto a la etiqueta",
    texto: "Tráela a sesión. Es mucho más útil revisarlo juntas que decidir sola si \"puedes\" o \"no puedes\" comer algo.",
  },
];
