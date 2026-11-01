import { db, getEventBySlug, audit } from "@/lib/db";
import { hostSession } from "@/lib/session";
import { signGet } from "@/lib/r2";
import { fail } from "@/lib/guard";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const ev = await getEventBySlug(slug);
  if (!ev) return fail("Evento no encontrado.", 404);
  const s = await hostSession(ev.id);
  if (!s) return fail("Ingresa con tu código.", 401);
  const { data } = await db().from("media").select("original_key").eq("id", id).eq("event_id", ev.id).maybeSingle();
  const row = data as { original_key: string } | null;
  if (!row) return fail("Foto no encontrada.", 404);
  await audit(ev.id, "host", s.accessId, "host.download", { media: id });
  const ext = row.original_key.split(".").pop();
  return Response.redirect(await signGet(row.original_key, { download: `${ev.slug}-${id.slice(0, 8)}.${ext}`, seconds: 300 }), 302);
}
