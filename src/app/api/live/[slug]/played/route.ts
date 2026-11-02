import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { db, getEventBySlug } from "@/lib/db";
import { json, fail } from "@/lib/guard";

const body = z.object({
  photos: z.array(z.string().uuid()).max(50).default([]),
  notes: z.array(z.string().uuid()).max(50).default([]),
});

// La pantalla avisa qué fotos y mensajes acaba de proyectar: no se vuelven a reproducir.
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const k = new URL(req.url).searchParams.get("k") ?? "";
  const ev = await getEventBySlug(slug);
  if (!ev) return fail("Evento no encontrado.", 404);
  const a = Buffer.from(k), b = Buffer.from(ev.screen_key);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return fail("Clave de pantalla no válida.", 401);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Datos no válidos.");
  const now = new Date().toISOString();
  const { photos, notes } = parsed.data;
  if (photos.length) {
    await db().from("media_destinations").update({ screen_played_at: now })
      .eq("event_id", ev.id).eq("destination", "screen").in("media_id", photos).is("screen_played_at", null);
  }
  if (notes.length) {
    await db().from("messages").update({ screen_played_at: now })
      .eq("event_id", ev.id).in("id", notes).is("screen_played_at", null);
  }
  return json({ ok: true });
}
