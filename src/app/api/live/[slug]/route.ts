import { timingSafeEqual } from "node:crypto";
import { db, getEventBySlug } from "@/lib/db";
import { signGet } from "@/lib/r2";
import { json, fail } from "@/lib/guard";
import { env } from "@/lib/env";
import { wallTiming } from "@/lib/screen";

const TAGLINES: Record<string, string> = {
  matrimonio: "¡Que siga la fiesta!",
  cumpleanos: "¡Que siga la fiesta!",
  celebracion: "¡Que siga la fiesta!",
  corporativo: "Gracias por acompañarnos",
  otro: "¡Que siga la fiesta!",
};

// Pantalla en vivo: fotos, mensajes sin foto e identidad del evento. Requiere la clave de pantalla.
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const k = new URL(req.url).searchParams.get("k") ?? "";
  const ev = await getEventBySlug(slug);
  if (!ev) return fail("Evento no encontrado.", 404);
  const a = Buffer.from(k), b = Buffer.from(ev.screen_key);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return fail("Clave de pantalla no válida.", 401);

  const nowIso = new Date().toISOString();
  // Solo lo que no se ha proyectado, más lo que está en pantalla ahora (para recuperar el muro si se recarga)
  const { dwell } = wallTiming(ev.screen_slide_seconds);
  const recentIso = new Date(Date.now() - (dwell + 30) * 1000).toISOString();
  const notPlayedOrRecent = `screen_played_at.is.null,screen_played_at.gt.${recentIso}`;
  const [{ data: state }, { data: rows }, { data: notes }] = await Promise.all([
    db().from("live_state").select("*").eq("event_id", ev.id).maybeSingle(),
    db().from("screen_items").select("id, display_key, width, height, approved_at, featured, message, screen_played_at")
      .eq("event_id", ev.id).gt("screen_expires_at", nowIso).or(notPlayedOrRecent).order("approved_at", { ascending: true }).limit(200),
    db().from("screen_notes").select("id, body, approved_at, screen_played_at")
      .eq("event_id", ev.id).gt("screen_expires_at", nowIso).or(notPlayedOrRecent).order("approved_at", { ascending: true }).limit(200),
  ]);

  const items = await Promise.all(
    ((rows ?? []) as { id: string; display_key: string; width: number | null; height: number | null; featured: boolean; message: string | null; approved_at: string; screen_played_at: string | null }[]).map(
      async (r) => ({ id: r.id, url: await signGet(r.display_key, { seconds: 3600 }), width: r.width, height: r.height, featured: r.featured, message: r.message, at: r.approved_at, playedAt: r.screen_played_at }),
    ),
  );
  const s = (state ?? { paused: false, layout: "auto", featured_media_id: null, show_qr: true }) as { paused: boolean; layout: string; featured_media_id: string | null; show_qr: boolean };
  const date = new Intl.DateTimeFormat("es-CL", { timeZone: ev.timezone, day: "2-digit", month: "2-digit", year: "numeric" })
    .format(new Date(ev.starts_at)).replace(/[-/.]/g, " · ");

  return json({
    event: {
      name: ev.name,
      hosts: ev.hosts_names,
      type: ev.event_type,
      date,
      tagline: ev.tagline || TAGLINES[ev.event_type] || TAGLINES.otro,
      logo: ev.logo_key ? await signGet(ev.logo_key, { seconds: 3600 }) : null,
      slideSeconds: ev.screen_slide_seconds,
      ...wallTiming(ev.screen_slide_seconds),
    },
    state: { paused: s.paused, layout: s.layout, featured: s.featured_media_id, showQr: s.show_qr },
    guestUrl: `${env.siteUrl()}/e/${ev.slug}`,
    items,
    notes: ((notes ?? []) as { id: string; body: string; approved_at: string; screen_played_at: string | null }[]).map((n) => ({ id: n.id, body: n.body, at: n.approved_at, playedAt: n.screen_played_at })),
  });
}
