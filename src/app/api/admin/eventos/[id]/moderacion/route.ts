import { z } from "zod";
import { db } from "@/lib/db";
import { adminEvent } from "@/lib/admin-event";
import { moderate, moderateNote } from "@/lib/media";
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
  const { data: notes } = await db().from("messages").select("id, body, created_at").eq("event_id", id).is("media_id", null).eq("moderation", status).order("created_at").limit(100);
  return json({ items, notes: notes ?? [] });
}

const body = z.union([
  z.object({ mediaId: z.string().uuid(), destination: z.enum(["screen", "album"]), action: z.enum(["approve", "reject", "remove", "feature", "unfeature"]) }),
  z.object({ messageId: z.string().uuid(), action: z.enum(["approve", "reject", "remove"]) }),
]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await adminEvent(id);
  if (!a) return fail("No autorizado.", 401);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Datos no válidos.");
  const d = parsed.data;
  if ("messageId" in d) await moderateNote(a.ev, d.messageId, d.action, a.actor);
  else await moderate(a.ev, d.mediaId, d.destination, d.action, a.actor);
  return json({ ok: true });
}
