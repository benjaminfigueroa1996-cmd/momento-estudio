import "server-only";
import { db, type EventRow } from "./db";
import { sha256 } from "./crypto";

// Autenticación de las estaciones iPad: token largo en el encabezado Authorization
export async function stationFromRequest(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const tok = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (tok.length < 32) return null;
  const { data } = await db()
    .from("device_sessions")
    .select("id, name, revoked_at, events(*)")
    .eq("token_hash", sha256(tok))
    .maybeSingle();
  const row = data as { id: string; name: string; revoked_at: string | null; events: EventRow } | null;
  if (!row || row.revoked_at) return null;
  await db().from("device_sessions").update({ last_seen_at: new Date().toISOString() }).eq("id", row.id);
  return { deviceId: row.id, name: row.name, event: row.events };
}
