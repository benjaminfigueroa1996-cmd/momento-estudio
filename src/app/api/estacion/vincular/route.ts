import { z } from "zod";
import { db, audit } from "@/lib/db";
import { sha256, token } from "@/lib/crypto";
import { json, fail, rateLimit } from "@/lib/guard";

const body = z.object({ code: z.string().trim().length(8) });

// El iPad canjea un código de 8 caracteres (15 minutos, un solo uso) por un token largo
export async function POST(req: Request) {
  if (!(await rateLimit("pair", 10, 900))) return fail("Demasiados intentos. Espera 15 minutos.", 429);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Código no válido.");
  const { data } = await db()
    .from("device_sessions")
    .select("id, event_id, name, pairing_expires_at, events(slug, name)")
    .eq("pairing_code_hash", sha256(parsed.data.code.toUpperCase()))
    .is("revoked_at", null)
    .maybeSingle();
  const row = data as { id: string; event_id: string; name: string; pairing_expires_at: string | null; events: { slug: string; name: string } } | null;
  if (!row || !row.pairing_expires_at || new Date(row.pairing_expires_at) < new Date()) return fail("Código no válido o vencido.", 401);
  const tok = token(32);
  await db().from("device_sessions").update({ token_hash: sha256(tok), pairing_code_hash: null, pairing_expires_at: null }).eq("id", row.id);
  await audit(row.event_id, "device", row.id, "device.paired");
  return json({ token: tok, device: row.name, event: row.events });
}
