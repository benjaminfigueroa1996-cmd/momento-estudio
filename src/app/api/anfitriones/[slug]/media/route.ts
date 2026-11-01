import { db, getEventBySlug } from "@/lib/db";
import { hostSession } from "@/lib/session";
import { signGet } from "@/lib/r2";
import { json, fail } from "@/lib/guard";

// Archivo privado: TODAS las fotos del evento, cualquiera sea su destino o estado en pantalla
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ev = await getEventBySlug(slug);
  if (!ev) return fail("Evento no encontrado.", 404);
  if (!(await hostSession(ev.id))) return fail("Ingresa con tu código.", 401);

  const url = new URL(req.url);
  const filter = url.searchParams.get("f") ?? "todas"; // todas | pantalla | album | fotografo | intervenidas
  const before = url.searchParams.get("before");

  let q = db()
    .from("media")
    .select("id, source, thumb_key, display_key, created_at, width, height, media_destinations(destination, moderation, screen_expires_at), messages(body), edited:media_versions!media_versions_edited_media_id_fkey(original_media_id)")
    .eq("event_id", ev.id)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(60);
  if (before) q = q.lt("created_at", before);
  if (filter === "fotografo") q = q.eq("source", "photographer");
  if (filter === "intervenidas") q = q.eq("source", "station");
  const { data, error } = await q;
  if (error) return fail("No se pudo cargar el archivo.", 500);

  type Row = {
    id: string; source: string; thumb_key: string; display_key: string; created_at: string; width: number | null; height: number | null;
    media_destinations: { destination: string; moderation: string; screen_expires_at: string | null }[];
    messages: { body: string }[];
    edited: { original_media_id: string }[];
  };
  let rows = (data ?? []) as unknown as Row[];
  if (filter === "pantalla") rows = rows.filter((r) => r.media_destinations.some((d) => d.destination === "screen"));
  if (filter === "album") rows = rows.filter((r) => r.media_destinations.some((d) => d.destination === "album"));

  const now = Date.now();
  const items = await Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      source: r.source,
      thumb: await signGet(r.thumb_key, { seconds: 3600 }),
      display: await signGet(r.display_key, { seconds: 3600 }),
      destinations: r.media_destinations.map((d) => ({
        destination: d.destination,
        moderation: d.moderation,
        onScreenNow: d.destination === "screen" && d.moderation === "approved" && !!d.screen_expires_at && new Date(d.screen_expires_at).getTime() > now,
      })),
      messages: r.messages.map((m) => m.body),
      originalOf: r.edited[0]?.original_media_id ?? null,
      createdAt: r.created_at,
    })),
  );
  return json({ items, next: (data ?? []).length === 60 ? (data as Row[]).at(-1)!.created_at : null });
}
