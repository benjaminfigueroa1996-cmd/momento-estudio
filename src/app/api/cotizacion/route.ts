import { db } from "@/lib/db";
import { quoteSchema } from "@/lib/schemas";
import { json, fail, rateLimit } from "@/lib/guard";
import { brandedEmail, sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  if (!(await rateLimit("quote", 5, 3600))) return fail("Ya recibimos varias solicitudes desde esta conexión. Intenta más tarde.", 429);
  const parsed = quoteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Revisa los datos del formulario.");
  const { website, ...q } = parsed.data;
  if (website) return json({ ok: true }); // bot: se descarta en silencio

  const row = {
    name: q.name,
    email: q.email,
    phone: q.phone || null,
    event_type: q.event_type,
    event_date: q.event_date || null,
    location: q.location || null,
    guests: q.guests ?? null,
    comments: q.comments || null,
  };
  const { error } = await db().from("quote_requests").insert(row);
  if (error) return fail("No pudimos guardar tu solicitud. Intenta nuevamente.", 500);

  // Correos en español con la marca (requiere RESEND_API_KEY y COMMERCIAL_EMAIL)
  const fecha = row.event_date ? new Date(`${row.event_date}T12:00:00`).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" }) : "";
  const detalle: [string, string][] = [
    ["Nombre", row.name], ["Correo", row.email], ["Teléfono", row.phone ?? ""], ["Tipo de evento", row.event_type],
    ["Fecha", fecha], ["Lugar", row.location ?? ""], ["Invitados", row.guests ? String(row.guests) : ""], ["Comentarios", row.comments ?? ""],
  ];
  const texto = detalle.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");
  if (process.env.COMMERCIAL_EMAIL) {
    // Aviso interno
    await sendEmail([process.env.COMMERCIAL_EMAIL], `Nueva cotización: ${row.event_type} · ${row.name}`,
      brandedEmail({ title: "Nueva solicitud de cotización", paragraphs: ["Llegó una solicitud desde el sitio. Responde directamente a este correo para escribirle."], rows: detalle,
        cta: { label: "Ver en el panel", url: `${env.siteUrl()}/admin/cotizaciones` } }),
      texto, row.email);
    // Confirmación al cliente
    await sendEmail([row.email], "Recibimos tu solicitud · Momento Estudio",
      brandedEmail({
        preheader: "Te responderemos pronto con una propuesta a medida.",
        title: `¡Gracias, ${row.name.split(" ")[0]}!`,
        paragraphs: ["Recibimos tu solicitud de cotización. Te escribiremos pronto con una propuesta a medida para tu evento.", "Este es el resumen de lo que nos enviaste:"],
        rows: detalle.filter(([k]) => k !== "Nombre" && k !== "Correo"),
        footnote: "Si quieres agregar algo, solo responde este correo.",
      }),
      `Hola ${row.name}, recibimos tu solicitud de cotización. Te escribiremos pronto.\n\n${texto}`, process.env.COMMERCIAL_EMAIL);
  }
  return json({ ok: true });
}
