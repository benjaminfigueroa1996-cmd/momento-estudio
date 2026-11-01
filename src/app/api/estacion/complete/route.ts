import { z } from "zod";
import { db } from "@/lib/db";
import { completeUpload } from "@/lib/media";
import { destinationsSchema, messageSchema } from "@/lib/schemas";
import { stationFromRequest } from "@/lib/station";
import { json, fail } from "@/lib/guard";

const body = z.object({
  mediaId: z.string().uuid(),
  originalId: z.string().uuid(),
  destinations: destinationsSchema,
  message: messageSchema,
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

// Guarda la versión intervenida como nueva foto enlazada a su original (que no cambia)
export async function POST(req: Request) {
  const st = await stationFromRequest(req);
  if (!st) return fail("Estación no autorizada.", 401);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos no válidos.");
  const d = parsed.data;
  const { data: own } = await db().from("media").select("id").eq("id", d.mediaId).eq("device_session_id", st.deviceId).eq("event_id", st.event.id).maybeSingle();
  if (!own) return fail("Foto no encontrada.", 404);
  try {
    await completeUpload(st.event, d.mediaId, "station", d.destinations, d.message, d);
    await db().from("media_versions").upsert(
      { event_id: st.event.id, original_media_id: d.originalId, edited_media_id: d.mediaId, device_session_id: st.deviceId },
      { onConflict: "edited_media_id" },
    );
    return json({ ok: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}
