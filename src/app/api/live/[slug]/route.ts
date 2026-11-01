import { timingSafeEqual } from "node:crypto";
import { db, getEventBySlug } from "@/lib/db";
import { signGet } from "@/lib/r2";
import { json, fail } from "@/lib/guard";
import { env } from "@/lib/env";

// Pantalla en vivo: consulta cada pocos segundos (sin conexión en tiempo real,
// así se recupera sola si se corta internet). Requiere la clave de pantalla.
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const k = new URL(req.url).searchParams.get("k") ?? "";
  const ev = await getEventBySlug(slug);
  if (!ev) return fail("Evento no encontrado.", 404);
  const a = Buffer.from(k), b = Buffer.from(ev.screen_key);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return fail("Clave de pantalla no válida.", 401);

  const [{ data: state }, { data: rows }] = await Promise.all([
    db().from("live_state").select("*").eq("event_id", ev.id).maybeSingle(),
    db()
      .from("screen_items")
      .select("id, display_key, width, height, approved_at, featured, message")
      .eq("event_id", ev.id)
      .gt("screen_expires_at", new Date().toISOString())
      .order("approved_at", { ascending: true })
      .limit(200),
  ]);

  const items = await Promise.all(
    ((rows ?? []) as { id: string; display_key: string; width: number | null; height: number | null; featured: boolean; message: string | null }[]).map(
      async (r) => ({ id: r.id, url: await signGet(r.display_key, { seconds: 3600 }), width: r.width, height: r.height, featured: r.featured, message: r.message }),
    ),
  );

  const s = (state ?? { paused: false, layout: "auto", featured_media_id: null, show_qr: true }) as {
    paused: boolean; layout: string; featured_media_id: string | null; show_qr: boolean;
  };
  return json({
    event: { name: ev.name, hosts: ev.hosts_names, slideSeconds: ev.screen_slide_seconds },
    state: { paused: s.paused, layout: s.layout, featured: s.featured_media_id, showQr: s.show_qr },
    guestUrl: `${env.siteUrl()}/e/${ev.slug}`,
    items,
  });
}
