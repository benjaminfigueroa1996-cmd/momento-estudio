import { z } from "zod";
import { db } from "@/lib/db";
import { createUploads } from "@/lib/media";
import { stationFromRequest } from "@/lib/station";
import { json, fail } from "@/lib/guard";

const body = z.object({ originalId: z.string().uuid(), size: z.number().int().positive() });

export async function POST(req: Request) {
  const st = await stationFromRequest(req);
  if (!st) return fail("Estación no autorizada.", 401);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Datos no válidos.");
  const { data: orig } = await db().from("media").select("id").eq("id", parsed.data.originalId).eq("event_id", st.event.id).maybeSingle();
  if (!orig) return fail("Foto original no encontrada.", 404);
  try {
    const { tickets } = await createUploads(st.event, "station", [{ type: "image/jpeg", size: parsed.data.size }], { deviceSessionId: st.deviceId });
    return json({ ticket: tickets[0] });
  } catch (e) {
    return fail((e as Error).message);
  }
}
