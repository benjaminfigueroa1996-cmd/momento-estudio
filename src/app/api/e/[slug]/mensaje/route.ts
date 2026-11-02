import { cookies } from "next/headers";
import { z } from "zod";
import { db, getEventBySlug, uploadsOpen } from "@/lib/db";
import { rateLimit, json, fail, clientIp } from "@/lib/guard";
import { sha256, token, ipHash } from "@/lib/crypto";

const body = z.object({ body: z.string().trim().min(1, "Escribe un mensaje").max(280, "El mensaje puede tener hasta 280 caracteres") });
const MAX_NOTES_PER_GUEST = 15;

// Mensaje sin foto para la pantalla del evento
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await rateLimit(`note:${slug}`, 300, 60))) return fail("Demasiados mensajes seguidos. Espera un minuto.", 429);
  const ev = await getEventBySlug(slug);
  if (!ev) return fail("Evento no encontrado.", 404);
  if (!uploadsOpen(ev)) return fail("La recepción de mensajes de este evento ya cerró.", 403);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Mensaje no válido.");
  const text = parsed.data.body.replace(/[\u0000-\u001f\u007f]/g, " ");

  const jar = await cookies();
  let guest = jar.get("me_guest")?.value;
  if (!guest) {
    guest = token(24);
    jar.set("me_guest", guest, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30, path: "/" });
  }
  const { data: session } = await db()
    .from("upload_sessions")
    .upsert({ event_id: ev.id, guest_token_hash: sha256(guest), ip_hash: ipHash(await clientIp()) }, { onConflict: "event_id,guest_token_hash" })
    .select("id")
    .single();
  const sessionId = (session as { id: string } | null)?.id ?? null;

  if (sessionId) {
    const { count } = await db().from("messages").select("id", { count: "exact", head: true }).eq("upload_session_id", sessionId).is("media_id", null);
    if ((count ?? 0) >= MAX_NOTES_PER_GUEST) return fail(`Puedes enviar hasta ${MAX_NOTES_PER_GUEST} mensajes en este evento.`, 403);
  }

  const now = new Date();
  const approved = !ev.moderate_screen;
  const { error } = await db().from("messages").insert({
    event_id: ev.id,
    media_id: null,
    body: text,
    upload_session_id: sessionId,
    moderation: approved ? "approved" : "pending",
    approved_at: approved ? now.toISOString() : null,
    screen_expires_at: approved ? new Date(now.getTime() + ev.screen_ttl_minutes * 60_000).toISOString() : null,
  });
  if (error) return fail("No pudimos guardar tu mensaje. Intenta de nuevo.", 500);
  return json({ ok: true, pending: !approved });
}
