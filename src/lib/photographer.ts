import "server-only";
import { db, type EventRow } from "./db";
import { sha256 } from "./crypto";

export async function photographerFromToken(tok: string) {
  const { data } = await db()
    .from("photographer_links")
    .select("id, name, revoked_at, events(*)")
    .eq("token_hash", sha256(tok))
    .maybeSingle();
  const row = data as { id: string; name: string; revoked_at: string | null; events: EventRow } | null;
  if (!row || row.revoked_at) return null;
  return { linkId: row.id, name: row.name, event: row.events };
}
