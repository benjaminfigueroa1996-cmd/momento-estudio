import { z } from "zod";
import { db, audit } from "@/lib/db";
import { operatorFromToken } from "@/lib/operator";
import { moderate } from "@/lib/media";
import { signGet } from "@/lib/r2";
import { json, fail } from "@/lib/guard";
import { env } from "@/lib/env";

// Operador de pantalla: solo controla la presentación y puede retirar fotos de la pantalla.
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const op = await operatorFromToken((await params).token);
  if (!op) return fail("Enlace no válido o revocado.", 401);
  const [{ data: state }, { data: rows }] = await Promise.all([
    db().from("live_state").select("paused, layout, show_qr, featured_media_id").eq("event_id", op.event.id).maybeSingle(),
    db().from("screen_items").select("id, display_key, message, screen_expires_at").eq("event_id", op.event.id)
      .gt("screen_expires_at", new Date().toISOString()).order("approved_at", { ascending: false }).limit(40),
  ]);
  const items = await Promise.all(((rows ?? []) as { id: string; display_key: string; message: string | null }[]).map(async (r) => ({
    id: r.id, message: r.message, thumb: await signGet(r.display_key, { seconds: 1800 }),
  })));
  return json({
    event: { name: op.event.name },
    liveUrl: `${env.siteUrl()}/live/${op.event.slug}?k=${encodeURIComponent(op.event.screen_key)}`,
    state: state ?? { paused: false, layout: "auto", show_qr: true, featured_media_id: null },
    items,
  });
}

const body = z.union([
  z.object({
    paused: z.boolean().optional(),
    layout: z.enum(["auto", "chat", "full", "message", "mosaic", "gallery", "featured"]).optional(),
    featured_media_id: z.string().uuid().nullable().optional(),
    show_qr: z.boolean().optional(),
  }).strict(),
  z.object({ remove: z.string().uuid() }).strict(),
]);

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const op = await operatorFromToken((await params).token);
  if (!op) return fail("Enlace no válido o revocado.", 401);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Datos no válidos.");
  if ("remove" in parsed.data) {
    await moderate(op.event, parsed.data.remove, "screen", "remove", `operator:${op.linkId}`);
  } else {
    await db().from("live_state").upsert({ event_id: op.event.id, ...parsed.data, updated_at: new Date().toISOString() });
  }
  await audit(op.event.id, "admin", `operator:${op.linkId}`, "live.operator", parsed.data);
  return json({ ok: true });
}
