import { db } from "@/lib/db";
import { quoteSchema } from "@/lib/schemas";
import { json, fail, rateLimit } from "@/lib/guard";

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

  // Aviso por correo cuando se configure RESEND_API_KEY y COMMERCIAL_EMAIL
  if (process.env.RESEND_API_KEY && process.env.COMMERCIAL_EMAIL) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `Momento Estudio <${process.env.COMMERCIAL_EMAIL}>`,
        to: [process.env.COMMERCIAL_EMAIL],
        reply_to: q.email,
        subject: `Nueva cotización: ${q.event_type} · ${q.name}`,
        text: Object.entries(row).map(([k, v]) => `${k}: ${v ?? "-"}`).join("\n"),
      }),
    }).catch(() => undefined);
  }
  return json({ ok: true });
}
