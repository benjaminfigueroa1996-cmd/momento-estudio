import { db } from "@/lib/db";
import { signGet } from "@/lib/r2";
import { stationFromRequest } from "@/lib/station";
import { json, fail } from "@/lib/guard";

// Fotos disponibles para intervenir: aprobadas en álbum o pantalla, sin versiones ya intervenidas
export async function GET(req: Request) {
  const st = await stationFromRequest(req);
  if (!st) return fail("Estación no autorizada.", 401);
  const { data } = await db()
    .from("media")
    .select("id, display_key, thumb_key, width, height, created_at, media_destinations!inner(moderation)")
    .eq("event_id", st.event.id)
    .eq("status", "ready")
    .neq("source", "station")
    .eq("media_destinations.moderation", "approved")
    .order("created_at", { ascending: false })
    .limit(120);
  const rows = (data ?? []) as { id: string; display_key: string; thumb_key: string; width: number | null; height: number | null }[];
  const unique = Array.from(new Map(rows.map((r) => [r.id, r])).values());
  const items = await Promise.all(
    unique.map(async (r) => ({ id: r.id, thumb: await signGet(r.thumb_key, { seconds: 7200 }), display: await signGet(r.display_key, { seconds: 7200 }), width: r.width, height: r.height })),
  );
  return json({ event: { name: st.event.name, hosts: st.event.hosts_names }, items });
}
