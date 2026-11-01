import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db, audit } from "@/lib/db";
import { adminEvent } from "@/lib/admin-event";
import { sha256 } from "@/lib/crypto";
import { json, fail } from "@/lib/guard";

// Registra un iPad y entrega un código de vinculación de 8 caracteres (15 minutos)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await adminEvent(id);
  if (!a) return fail("No autorizado.", 401);
  const parsed = z.object({ name: z.string().trim().min(2).max(40), deviceId: z.string().uuid().optional() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Escribe un nombre para el iPad.");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const code = Array.from(randomBytes(8), (b) => alphabet[b % alphabet.length]).join("");
  const patch = { pairing_code_hash: sha256(code), pairing_expires_at: new Date(Date.now() + 15 * 60_000).toISOString() };
  if (parsed.data.deviceId) {
    await db().from("device_sessions").update({ ...patch, token_hash: null }).eq("id", parsed.data.deviceId).eq("event_id", id);
  } else {
    await db().from("device_sessions").insert({ event_id: id, name: parsed.data.name, ...patch });
  }
  await audit(id, "admin", a.actor, "device.pairing_code", { name: parsed.data.name });
  return json({ code });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await adminEvent(id);
  if (!a) return fail("No autorizado.", 401);
  const deviceId = new URL(req.url).searchParams.get("device");
  if (!deviceId) return fail("Falta el iPad.");
  await db().from("device_sessions").update({ revoked_at: new Date().toISOString() }).eq("id", deviceId).eq("event_id", id);
  return json({ ok: true });
}
