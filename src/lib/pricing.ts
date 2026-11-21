// Cálculo de cotizaciones. Se usa igual en el navegador (precio en vivo) y en el servidor (cotización formal).
// Todos los montos en pesos chilenos, sin IVA.

export type PricingConfig = {
  plataforma: number; // solo plataforma, cubre todo el evento
  completo: number; // plataforma + 1 estación iPad + fotógrafo + ayudante
  horasFotografo: number; // horas de fotógrafo y ayudante incluidas en el completo
  traslado: number; // se cobra cuando el equipo va al evento (dentro del radio de Santiago)
  trasladoRadioKm: number; // km por carretera desde el centro de Santiago sin recargo
  trasladoPorKm: number; // valor por cada km (ida) sobre el radio
  trasladoRevisarKm: number; // sobre esta distancia se revisa a mano (alojamiento)
  segundoFotografo: number;
  segundoIpad: number;
  horaExtra: number; // hora adicional de fotógrafo + ayudante
  horaExtraSegundo: number; // hora adicional del segundo fotógrafo
  invitadosBase: number; // hasta esta cantidad no hay recargo
  invitadosMedio: number; // hasta esta cantidad aplica el recargo medio
  recargoMedio: number;
  recargoAlto: number;
  temporadaPct: number; // recargo de temporada alta, incluido en cada línea (no se muestra)
  temporadaMeses: number[]; // 1 = enero
  temporadaDias: number[]; // 0 = domingo … 6 = sábado
  ivaPct: number;
  vigenciaDias: number;
  reservaPct: number;
};

export const DEFAULT_PRICING: PricingConfig = {
  plataforma: 350000,
  completo: 900000,
  horasFotografo: 5,
  traslado: 100000,
  trasladoRadioKm: 40,
  trasladoPorKm: 1500,
  trasladoRevisarKm: 250,
  segundoFotografo: 350000,
  segundoIpad: 150000,
  horaExtra: 90000,
  horaExtraSegundo: 50000,
  invitadosBase: 150,
  invitadosMedio: 300,
  recargoMedio: 60000,
  recargoAlto: 120000,
  temporadaPct: 15,
  temporadaMeses: [10, 11, 12, 1, 2, 3],
  temporadaDias: [5, 6],
  ivaPct: 19,
  vigenciaDias: 15,
  reservaPct: 50,
};

export type Paquete = "plataforma" | "completo";

export type QuoteInput = {
  paquete: Paquete;
  invitados?: number;
  fecha?: string; // AAAA-MM-DD
  segundoFotografo?: boolean;
  segundoIpad?: boolean;
  horasExtra?: number;
  distanciaKm?: number; // km por carretera (aprox.) desde el centro de Santiago; vacío = lugar no verificado
};

export type QuoteLine = { concepto: string; detalle?: string; monto: number };

export type Quote = {
  lineas: QuoteLine[];
  neto: number;
  iva: number;
  total: number;
  revisar: string[]; // motivos para que el equipo revise antes de confirmar
};

export function mergePricing(raw: unknown): PricingConfig {
  const out = { ...DEFAULT_PRICING } as Record<string, unknown>;
  if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (!(k in DEFAULT_PRICING)) continue;
      const def = (DEFAULT_PRICING as Record<string, unknown>)[k];
      if (Array.isArray(def) && Array.isArray(v)) out[k] = v.map(Number).filter((n) => Number.isFinite(n));
      else if (typeof def === "number" && Number.isFinite(Number(v))) out[k] = Number(v);
    }
  }
  return out as PricingConfig;
}

export function esTemporadaAlta(cfg: PricingConfig, fecha?: string) {
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const d = new Date(`${fecha}T12:00:00`);
  return cfg.temporadaMeses.includes(d.getMonth() + 1) && cfg.temporadaDias.includes(d.getDay());
}

const clp = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");
export const formatCLP = clp;

export function calcularCotizacion(cfg: PricingConfig, q: QuoteInput): Quote {
  const factor = esTemporadaAlta(cfg, q.fecha) ? 1 + cfg.temporadaPct / 100 : 1;
  // Redondeo a miles para que los montos se vean limpios
  const p = (n: number) => Math.round((n * factor) / 1000) * 1000;
  const lineas: QuoteLine[] = [];
  const completo = q.paquete === "completo";

  if (completo) {
    lineas.push({
      concepto: "Paquete completo",
      detalle: `Plataforma durante todo el evento (QR, pantalla en vivo, álbum y archivo privado), estación iPad con Apple Pencil, fotógrafo y ayudante por ${cfg.horasFotografo} horas`,
      monto: p(cfg.completo),
    });
  } else {
    lineas.push({
      concepto: "Plataforma Momento Estudio",
      detalle: "Durante todo el evento: código QR, pantalla en vivo, álbum compartido, archivo privado y enlace para el fotógrafo",
      monto: p(cfg.plataforma),
    });
  }

  const inv = q.invitados ?? 0;
  if (inv > cfg.invitadosMedio) lineas.push({ concepto: `Evento de más de ${cfg.invitadosMedio} invitados`, detalle: "Capacidad y almacenamiento ampliados", monto: p(cfg.recargoAlto) });
  else if (inv > cfg.invitadosBase) lineas.push({ concepto: `Evento de ${cfg.invitadosBase + 1} a ${cfg.invitadosMedio} invitados`, detalle: "Capacidad y almacenamiento ampliados", monto: p(cfg.recargoMedio) });

  if (completo) {
    if (q.segundoFotografo) lineas.push({ concepto: "Segundo fotógrafo", detalle: `${cfg.horasFotografo} horas`, monto: p(cfg.segundoFotografo) });
    if (q.segundoIpad) lineas.push({ concepto: "Segunda estación iPad", detalle: "Con Apple Pencil", monto: p(cfg.segundoIpad) });
    const h = Math.max(0, Math.min(8, Math.floor(q.horasExtra ?? 0)));
    if (h > 0) {
      const fotografos = q.segundoFotografo ? 2 : 1;
      lineas.push({
        concepto: `${h} ${h === 1 ? "hora adicional" : "horas adicionales"}`,
        detalle: fotografos === 2 ? "Dos fotógrafos y ayudante" : "Fotógrafo y ayudante",
        monto: p((cfg.horaExtra + (fotografos === 2 ? cfg.horaExtraSegundo : 0)) * h),
      });
    }
    const km = q.distanciaKm;
    const extraKm = km != null ? Math.max(0, km - cfg.trasladoRadioKm) : 0;
    const traslado = Math.round((cfg.traslado + extraKm * cfg.trasladoPorKm) / 1000) * 1000;
    lineas.push({
      concepto: "Traslado de equipo y personal",
      detalle: km == null ? "Valor referencial, se confirma según el lugar" : extraKm > 0 ? `Aprox. ${Math.round(km)} km desde Santiago` : "Santiago y alrededores",
      monto: traslado,
    });
  }

  const neto = lineas.reduce((s, l) => s + l.monto, 0);
  const iva = Math.round((neto * cfg.ivaPct) / 100);
  const revisar: string[] = [];
  if (completo && q.distanciaKm == null) revisar.push("Lugar no verificado en el mapa: confirmar traslado");
  if (completo && q.distanciaKm != null && q.distanciaKm > cfg.trasladoRevisarKm) revisar.push(`Evento a ${Math.round(q.distanciaKm)} km: revisar alojamiento y viáticos`);
  if (inv > 600) revisar.push("Más de 600 invitados");
  return { lineas, neto, iva, total: neto + iva, revisar };
}

// Distancia aproximada por carretera desde la Plaza de Armas de Santiago
const SANTIAGO = { lat: -33.4378, lng: -70.6505 };
export function distanciaDesdeSantiago(lat: number, lng: number) {
  const r = (x: number) => (x * Math.PI) / 180;
  const dLat = r(lat - SANTIAGO.lat), dLng = r(lng - SANTIAGO.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(SANTIAGO.lat)) * Math.cos(r(lat)) * Math.sin(dLng / 2) ** 2;
  const recta = 6371 * 2 * Math.asin(Math.sqrt(a));
  return Math.round(recta * 1.3); // factor carretera
}
