import { cookies } from "next/headers";
import { z } from "zod";
import { db, getEventBySlug, uploadsOpen } from "@/lib/db";
import { createUploads } from "@/lib/media";
import { fileRequestSchema } from "@/lib/schemas";
import { rateLimit, json, fail, clientIp } from "@/lib/guard";
import { sha256, token, ipHash } from "@/lib/crypto";

const body = z.object({ files: z.array(fileRequestSchema).min(1).max(20) });
const GUEST_COOKIE = "me_guest";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Límite alto: en un salón muchos invitados comparten la IP del wifi; el tope real es por invitado.
  if (!(await rateLimit(`up:${slug}`, 600, 60))) return fail("Demasiadas cargas seguidas. Espera un minuto.", 429);

  const ev = await getEventBySlug(slug);
  if (!ev) return fail("Evento no encontrado.", 404);
  if (!uploadsOpen(ev)) return fail("La recepción de fotos de este evento ya cerró.", 403);

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Solo se aceptan fotos JPG, PNG, WebP o HEIC.");

  // Sesión anónima del invitado: sin cuenta, solo un identificador en una cookie
  const jar = await cookies();
  let guest = jar.get(GUEST_COOKIE)?.value;
  if (!guest) {
    guest = token(24);
    jar.set(GUEST_COOKIE, guest, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30, path: "/" });
  }
  const { data: session } = await db()
    .from("upload_sessions")
    .upsert({ event_id: ev.id, guest_token_hash: sha256(guest), ip_hash: ipHash(await clientIp()) }, { onConflict: "event_id,guest_token_hash" })
    .select("id, uploads_count")
    .single();
  const s = session as { id: string; uploads_count: number } | null;
  if (!s) return fail("No se pudo iniciar la carga.", 500);

  const n = parsed.data.files.length;
  if (s.uploads_count + n > ev.max_uploads_per_guest) {
    return fail(`Puedes compartir hasta ${ev.max_uploads_per_guest} fotos en este evento.`, 403);
  }

  try {
    const { tickets } = await createUploads(ev, "guest", parsed.data.files, { uploadSessionId: s.id });
    await db().from("upload_sessions").update({ uploads_count: s.uploads_count + tickets.length }).eq("id", s.id);
    return json({ tickets });
  } catch (e) {
    return fail((e as Error).message);
  }
}
