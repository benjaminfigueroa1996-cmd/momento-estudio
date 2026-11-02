import { db, getEventBySlug } from "@/lib/db";
import { hostSession } from "@/lib/session";
import { signGet } from "@/lib/r2";
import { json, fail } from "@/lib/guard";

// Todos los mensajes del evento para los anfitriones: con foto y sin foto, cualquiera sea su estado
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ev = await getEventBySlug(slug);
  if (!ev) return fail("Evento no encontrado.", 404);
  if (!(await hostSession(ev.id))) return fail("Ingresa con tu código.", 401);
  const { data } = await db()
    .from("messages")
    .select("id, body, created_at, media(thumb_key)")
    .eq("event_id", ev.id)
    .order("created_at", { ascending: false })
    .limit(500);
  type Row = { id: string; body: string; created_at: string; media: { thumb_key: string } | null };
  const items = await Promise.all(
    ((data ?? []) as unknown as Row[]).map(async (m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.created_at,
      thumb: m.media?.thumb_key ? await signGet(m.media.thumb_key, { seconds: 3600 }) : null,
    })),
  );
  return json({ items });
}
