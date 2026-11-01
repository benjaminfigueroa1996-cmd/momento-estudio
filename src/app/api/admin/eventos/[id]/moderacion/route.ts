import { z } from "zod";
import { db } from "@/lib/db";
import { adminEvent } from "@/lib/admin-event";
import { moderate } from "@/lib/media";
import { signGet } from "@/lib/r2";
import { json, fail } from "@/lib/guard";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await adminEvent(id);
  if (!a) return fail("No autorizado.", 401);
  const status = new URL(req.url).searchParams.get("estado") ?? "pending";
  const { data } = await db()
    .from("media_destinations")
    .select("media_id, destination, moderation, featured, media!inner(thumb_key, display_key, source, created_at, status, messages(body))")
    .eq("event_id", id)
    .eq("moderation", status)
    .eq("media.status", "ready")
    .order("media_id")
    .limit(100);
  type Row = { media_id: string; destination: string; moderation: string; featured: boolean; media: { thumb_key: string; display_key: string; source: string; created_at: string; messages: { body: string }[] } };
  const items = await Promise.all(
    ((data ?? []) as unknown as Row[]).map(async (r) => ({
      mediaId: r.media_id,
      destination: r.destination,
      featured: r.featured,
      source: r.media.source,
      createdAt: r.media.created_at,
      message: r.media.messages[0]?.body ?? null,
      thumb: await signGet(r.media.thumb_key, { seconds: 1800 }),
      display: await signGet(r.media.display_key, { seconds: 1800 }),
    })),
  );
  return json({ items });
}

const body = z.object({
  mediaId: z.string().uuid(),
  destination: z.enum(["screen", "album"]),
  action: z.enum(["approve", "reject", "remove", "feature", "unfeature"]),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await adminEvent(id);
  if (!a) return fail("No autorizado.", 401);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Datos no válidos.");
  await moderate(a.ev, parsed.data.mediaId, parsed.data.destination, parsed.data.action, a.actor);
  return json({ ok: true });
}
