import { z } from "zod";
import { db, audit } from "@/lib/db";
import { adminEvent } from "@/lib/admin-event";
import { json, fail } from "@/lib/guard";

const body = z.object({
  paused: z.boolean().optional(),
  layout: z.enum(["auto", "chat", "full", "message", "mosaic", "gallery", "featured"]).optional(),
  featured_media_id: z.string().uuid().nullable().optional(),
  show_qr: z.boolean().optional(),
});

// Control remoto de la pantalla: la página /live lo lee en su siguiente consulta (≤ 4 s)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await adminEvent(id);
  if (!a) return fail("No autorizado.", 401);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Datos no válidos.");
  await db().from("live_state").upsert({ event_id: id, ...parsed.data, updated_at: new Date().toISOString() });
  await audit(id, "admin", a.actor, "live.update", parsed.data);
  return json({ ok: true });
}
