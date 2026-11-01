import { z } from "zod";
import { db } from "@/lib/db";
import { completeUpload } from "@/lib/media";
import { photographerFromToken } from "@/lib/photographer";
import { json, fail } from "@/lib/guard";

const body = z.object({
  mediaId: z.string().uuid(),
  filename: z.string().max(200),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

// Las fotos del fotógrafo van al álbum automáticamente y nunca a pantalla
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const p = await photographerFromToken(token);
  if (!p) return fail("Enlace de carga no válido o revocado.", 401);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Datos no válidos.");
  const { data: own } = await db().from("media").select("id").eq("id", parsed.data.mediaId).eq("photographer_link_id", p.linkId).maybeSingle();
  if (!own) return fail("Foto no encontrada.", 404);
  try {
    await completeUpload(p.event, parsed.data.mediaId, "photographer", ["album"], undefined, parsed.data);
    await db().from("photographer_uploads").insert({ link_id: p.linkId, media_id: parsed.data.mediaId, filename: parsed.data.filename, status: "ok" });
    return json({ ok: true });
  } catch (e) {
    await db().from("photographer_uploads").insert({ link_id: p.linkId, media_id: parsed.data.mediaId, filename: parsed.data.filename, status: "error", error: (e as Error).message });
    return fail((e as Error).message);
  }
}
