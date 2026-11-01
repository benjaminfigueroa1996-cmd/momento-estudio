import { z } from "zod";
import { db, audit } from "@/lib/db";
import { adminEvent } from "@/lib/admin-event";
import { sha256, token } from "@/lib/crypto";
import { env } from "@/lib/env";
import { json, fail } from "@/lib/guard";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await adminEvent(id);
  if (!a) return fail("No autorizado.", 401);
  const parsed = z.object({ name: z.string().trim().min(2).max(80) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Escribe el nombre del fotógrafo.");
  const tok = token(32);
  await db().from("photographer_links").insert({ event_id: id, name: parsed.data.name, token_hash: sha256(tok) });
  await audit(id, "admin", a.actor, "photographer_link.created", { name: parsed.data.name });
  return json({ url: `${env.siteUrl()}/fotografo/${tok}` });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await adminEvent(id);
  if (!a) return fail("No autorizado.", 401);
  const linkId = new URL(req.url).searchParams.get("link");
  if (!linkId) return fail("Falta el enlace.");
  await db().from("photographer_links").update({ revoked_at: new Date().toISOString() }).eq("id", linkId).eq("event_id", id);
  return json({ ok: true });
}
