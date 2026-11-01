import { cookies } from "next/headers";
import { z } from "zod";
import { db, getEventBySlug } from "@/lib/db";
import { completeUpload } from "@/lib/media";
import { destinationsSchema, messageSchema } from "@/lib/schemas";
import { json, fail, rateLimit } from "@/lib/guard";
import { sha256 } from "@/lib/crypto";

const body = z.object({
  mediaId: z.string().uuid(),
  destinations: destinationsSchema,
  message: messageSchema,
  width: z.number().int().positive().max(20000).optional(),
  height: z.number().int().positive().max(20000).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await rateLimit(`done:${slug}`, 1500, 60))) return fail("Demasiadas solicitudes. Espera un minuto.", 429);
  const ev = await getEventBySlug(slug);
  if (!ev) return fail("Evento no encontrado.", 404);

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos no válidos.");

  // La foto debe pertenecer a la sesión de este invitado
  const guest = (await cookies()).get("me_guest")?.value;
  if (!guest) return fail("Sesión no encontrada. Vuelve a escanear el QR.", 401);
  const { data: owned } = await db()
    .from("media")
    .select("id, upload_sessions!inner(guest_token_hash)")
    .eq("id", parsed.data.mediaId)
    .eq("event_id", ev.id)
    .eq("upload_sessions.guest_token_hash", sha256(guest))
    .maybeSingle();
  if (!owned) return fail("Foto no encontrada.", 404);

  try {
    await completeUpload(ev, parsed.data.mediaId, "guest", parsed.data.destinations, parsed.data.message, parsed.data);
    return json({ ok: true, pending: parsed.data.destinations.some((d) => (d === "screen" ? ev.moderate_screen : ev.moderate_album)) });
  } catch (e) {
    return fail((e as Error).message);
  }
}
