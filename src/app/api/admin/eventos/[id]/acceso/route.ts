import { db, audit } from "@/lib/db";
import { adminEvent } from "@/lib/admin-event";
import { hashSecret, hostCode } from "@/lib/crypto";
import { json, fail } from "@/lib/guard";

// Genera un código nuevo para anfitriones y revoca los anteriores. El código se muestra una sola vez.
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await adminEvent(id);
  if (!a) return fail("No autorizado.", 401);
  const code = hostCode();
  await db().from("couple_access").update({ revoked_at: new Date().toISOString() }).eq("event_id", id).is("revoked_at", null);
  await db().from("couple_access").insert({ event_id: id, code_hash: await hashSecret(code.replace(/-/g, "")), expires_at: a.ev.host_access_until });
  await audit(id, "admin", a.actor, "host_access.regenerated");
  return json({ code, url: `/anfitriones/${a.ev.slug}` });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await adminEvent(id);
  if (!a) return fail("No autorizado.", 401);
  await db().from("couple_access").update({ revoked_at: new Date().toISOString() }).eq("event_id", id).is("revoked_at", null);
  await audit(id, "admin", a.actor, "host_access.revoked");
  return json({ ok: true });
}
