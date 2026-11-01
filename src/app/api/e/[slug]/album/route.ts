import { db, getEventBySlug, albumOpen } from "@/lib/db";
import { signGet } from "@/lib/r2";
import { json, fail } from "@/lib/guard";

const PAGE = 48;

// Álbum de invitados: lee solo la vista album_items (nunca fotos solo de pantalla)
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ev = await getEventBySlug(slug);
  if (!ev) return fail("Evento no encontrado.", 404);
  if (!albumOpen(ev)) return fail("El álbum de este evento no está disponible.", 403);

  const before = new URL(req.url).searchParams.get("before");
  let q = db()
    .from("album_items")
    .select("id, source, display_key, thumb_key, width, height, created_at")
    .eq("event_id", ev.id)
    .order("created_at", { ascending: false })
    .limit(PAGE);
  if (before) q = q.lt("created_at", before);
  const { data } = await q;
  const rows = (data ?? []) as { id: string; source: string; display_key: string; thumb_key: string; width: number | null; height: number | null; created_at: string }[];

  const items = await Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      professional: r.source === "photographer",
      thumb: await signGet(r.thumb_key, { seconds: 3600 }),
      display: await signGet(r.display_key, { seconds: 3600 }),
      width: r.width,
      height: r.height,
      createdAt: r.created_at,
    })),
  );
  return json({ items, next: rows.length === PAGE ? rows.at(-1)!.created_at : null, downloads: ev.guest_downloads });
}
