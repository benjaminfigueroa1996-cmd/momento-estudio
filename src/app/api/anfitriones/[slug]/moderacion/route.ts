import { z } from "zod";
import { db, getEventBySlug, audit } from "@/lib/db";
import { hostSession } from "@/lib/session";
import { moderate } from "@/lib/media";
import { signGet } from "@/lib/r2";
import { json, fail } from "@/lib/guard";

// Los anfitriones pueden aprobar o rechazar contenido de su propio evento (si el evento lo permite)
async function guard(slug: string) {
  const ev = await getEventBySlug(slug);
  if (!ev) return { error: fail("Evento no encontrado.", 404) };
  const s = await hostSession(ev.id);
  if (!s) return { error: fail("Ingresa con tu código.", 401) };
  if (!ev.hosts_can_moderate) return { error: fail("La moderación de este evento la hace Momento Estudio.", 403) };
  return { ev, s };
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const g = await guard((await params).slug);
  if ("error" in g) return g.error;
  const { data } = await db()
    .from("media_destinations")
    .select("media_id, destination, media!inner(thumb_key, display_key, status, messages(body))")
    .eq("event_id", g.ev.id)
    .eq("moderation", "pending")
    .eq("media.status", "ready")
    .limit(100);
  type Row = { media_id: string; destination: string; media: { thumb_key: string; display_key: string; messages: { body: string }[] } };
  const items = await Promise.all(
    ((data ?? []) as unknown as Row[]).map(async (r) => ({
      mediaId: r.media_id,
      destination: r.destination,
      message: r.media.messages[0]?.body ?? null,
      thumb: await signGet(r.media.thumb_key, { seconds: 1800 }),
    })),
  );
  return json({ items });
}

const body = z.object({ mediaId: z.string().uuid(), destination: z.enum(["screen", "album"]), action: z.enum(["approve", "reject", "remove"]) });

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const g = await guard((await params).slug);
  if ("error" in g) return g.error;
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Datos no válidos.");
  await moderate(g.ev, parsed.data.mediaId, parsed.data.destination, parsed.data.action, `host:${g.s.accessId}`);
  await audit(g.ev.id, "host", g.s.accessId, `moderation.${parsed.data.action}`, { media: parsed.data.mediaId });
  return json({ ok: true });
}
