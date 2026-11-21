import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { quoteSchema } from "@/lib/schemas";
import { json, fail, rateLimit } from "@/lib/guard";
import { brandedEmail, sendEmail } from "@/lib/email";
import { getPricing } from "@/lib/pricing-server";
import { calcularCotizacion, distanciaDesdeSantiago, formatCLP } from "@/lib/pricing";

export async function POST(req: Request) {
  if (!(await rateLimit("quote", 8, 3600))) return fail("Ya recibimos varias solicitudes desde esta conexión. Intenta más tarde.", 429);
  const parsed = quoteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Revisa los datos del formulario.");
  const { website, ...q } = parsed.data;
  if (website) return json({ ok: true }); // bot: se descarta en silencio

  // El precio siempre se recalcula en el servidor con la tabla vigente
  const cfg = await getPricing();
  const opciones = {
    paquete: q.paquete,
    invitados: q.guests,
    fecha: q.event_date || undefined,
    segundoFotografo: q.paquete === "completo" && !!q.segundoFotografo,
    segundoIpad: q.paquete === "completo" && !!q.segundoIpad,
    horasExtra: q.paquete === "completo" ? q.horasExtra ?? 0 : 0,
    distanciaKm: q.lat != null && q.lng != null ? distanciaDesdeSantiago(q.lat, q.lng) : undefined,
    lat: q.lat, lng: q.lng,
  };
  const cot = calcularCotizacion(cfg, opciones);
  const token = randomBytes(18).toString("base64url");
  const vigencia = new Date(Date.now() + cfg.vigenciaDias * 86400000).toISOString().slice(0, 10);

  const row = {
    name: q.name,
    email: q.email,
    phone: q.phone || null,
    event_type: q.event_type,
    event_date: q.event_date || null,
    location: q.location || null,
    guests: q.guests ?? null,
    comments: q.comments || null,
    token,
    package: q.paquete,
    options: opciones,
    quote: { ...cot, ivaPct: cfg.ivaPct, reservaPct: cfg.reservaPct, horasFotografo: cfg.horasFotografo },
    total: cot.total,
    valid_until: vigencia,
    needs_review: cot.revisar.length > 0,
    status: "cotizada",
  };
  const { data: saved, error } = await db().from("quote_requests").insert(row).select("number").single();
  if (error) return fail("No pudimos guardar tu solicitud. Intenta nuevamente.", 500);

  const origin = new URL(req.url).origin;
  const link = `${origin}/cotizacion/${token}`;
  const numero = `N° ${String(saved?.number ?? "").padStart(4, "0")}`;
  const detalle: [string, string][] = [
    ...cot.lineas.map((l): [string, string] => [l.concepto, formatCLP(l.monto)]),
    ["Neto", formatCLP(cot.neto)],
    [`IVA (${cfg.ivaPct}%)`, formatCLP(cot.iva)],
    ["Total", formatCLP(cot.total)],
  ];
  const texto = detalle.map(([k, v]) => `${k}: ${v}`).join("\n");

  // Correos en español con la marca (requiere RESEND_API_KEY y COMMERCIAL_EMAIL)
  if (process.env.COMMERCIAL_EMAIL) {
    await sendEmail([process.env.COMMERCIAL_EMAIL], `Cotización ${numero}: ${row.event_type} · ${row.name}${row.needs_review ? " (revisar)" : ""}`,
      brandedEmail({
        title: "Nueva cotización enviada",
        paragraphs: [`${row.name} (${row.email}${row.phone ? `, ${row.phone}` : ""}) cotizó desde el sitio.`, ...cot.revisar.map((r) => `Revisar: ${r}`)],
        rows: detalle,
        cta: { label: "Ver cotización", url: link },
      }),
      texto, row.email).catch(() => null);
    await sendEmail([row.email], `Tu cotización ${numero} · Momento Estudio`,
      brandedEmail({
        preheader: `Total ${formatCLP(cot.total)} IVA incluido. Válida hasta el ${new Date(`${vigencia}T12:00:00`).toLocaleDateString("es-CL", { day: "numeric", month: "long" })}.`,
        title: `¡Gracias, ${row.name.split(" ")[0]}!`,
        paragraphs: ["Esta es la cotización para tu evento. Puedes verla completa y descargarla en PDF desde el botón.", "Para reservar la fecha, solo responde este correo."],
        rows: detalle,
        cta: { label: "Ver mi cotización", url: link },
        footnote: `Cotización válida por ${cfg.vigenciaDias} días. La fecha se reserva con el ${cfg.reservaPct}% del total.`,
      }),
      `Hola ${row.name}, esta es tu cotización:\n\n${texto}\n\nVer completa: ${link}`, process.env.COMMERCIAL_EMAIL).catch(() => null);
  }
  return json({ ok: true, token });
}
