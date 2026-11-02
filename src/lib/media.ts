import "server-only";
import { randomUUID } from "node:crypto";
import { db, type EventRow } from "./db";
import { signPut, head, firstBytes, sniffImage } from "./r2";
import { keysFor, extFor } from "./storage-keys";

type Source = "guest" | "photographer" | "station";
type Dest = "screen" | "album";

export type UploadTicket = {
  mediaId: string;
  original: string; // URL firmada para subir el original
  display: string;  // versión 2048 px generada en el navegador
  thumb: string;    // miniatura 480 px generada en el navegador
};

/** Reserva filas `media` y entrega URLs firmadas para subir directo a R2. */
export async function createUploads(
  ev: EventRow,
  source: Source,
  files: { type: string; size: number; name?: string; sha256?: string }[],
  owner: { uploadSessionId?: string; photographerLinkId?: string; deviceSessionId?: string },
): Promise<{ tickets: UploadTicket[]; duplicates: string[] }> {
  const maxBytes = ev.max_file_mb * 1024 * 1024;
  const tickets: UploadTicket[] = [];
  const duplicates: string[] = [];

  for (const f of files) {
    if (f.size > maxBytes) throw new Error(`Cada foto puede pesar hasta ${ev.max_file_mb} MB.`);

    if (source === "photographer" && f.sha256) {
      const { data: dup } = await db()
        .from("media")
        .select("id")
        .eq("event_id", ev.id)
        .eq("source", "photographer")
        .eq("sha256", f.sha256)
        .neq("status", "failed")
        .maybeSingle();
      if (dup) {
        duplicates.push(f.name ?? f.sha256);
        continue;
      }
    }

    const id = randomUUID();
    const keys = keysFor(ev.id, id, extFor(f.type));
    const { error } = await db().from("media").insert({
      id,
      event_id: ev.id,
      source,
      status: "uploading",
      original_key: keys.original,
      display_key: keys.display,
      thumb_key: keys.thumb,
      mime: f.type,
      bytes: f.size,
      sha256: f.sha256 ?? null,
      original_filename: f.name?.slice(0, 200) ?? null,
      upload_session_id: owner.uploadSessionId ?? null,
      photographer_link_id: owner.photographerLinkId ?? null,
      device_session_id: owner.deviceSessionId ?? null,
    });
    if (error) throw new Error("No se pudo preparar la carga. Intenta de nuevo.");

    const [o, d, t] = await Promise.all([
      signPut(keys.original, f.type, maxBytes),
      signPut(keys.display, "image/jpeg", maxBytes),
      signPut(keys.thumb, "image/jpeg", maxBytes),
    ]);
    tickets.push({ mediaId: id, original: o.url, display: d.url, thumb: t.url });
  }
  return { tickets, duplicates };
}

/**
 * Confirma una carga: valida el archivo real en R2, asigna destinos y mensaje.
 * Un solo original, uno o dos destinos, nunca una copia.
 */
export async function completeUpload(
  ev: EventRow,
  mediaId: string,
  source: Source,
  destinations: Dest[],
  message: string | undefined,
  dims?: { width?: number; height?: number },
) {
  const { data: m } = await db()
    .from("media")
    .select("id, event_id, source, status, original_key, display_key, mime")
    .eq("id", mediaId)
    .eq("event_id", ev.id) // aislamiento: el id debe pertenecer a este evento
    .maybeSingle();
  const row = m as { id: string; source: Source; status: string; original_key: string; display_key: string; mime: string } | null;
  if (!row || row.source !== source) throw new Error("Foto no encontrada.");
  if (row.status === "ready") return { ok: true };

  const info = await head(row.original_key);
  const bytes = await firstBytes(row.original_key);
  const kind = bytes ? sniffImage(bytes) : null;
  if (!info || !kind || info.bytes > ev.max_file_mb * 1024 * 1024) {
    await db().from("media").update({ status: "failed" }).eq("id", row.id);
    throw new Error("El archivo no es una imagen válida o supera el tamaño permitido.");
  }
  const hasDisplay = Boolean(await head(row.display_key));

  await db()
    .from("media")
    .update({
      status: "ready",
      bytes: info.bytes,
      mime: kind,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      // si el navegador no pudo generar la versión liviana (p. ej. HEIC), se usa el original
      ...(hasDisplay ? {} : { display_key: row.original_key, thumb_key: row.original_key }),
    })
    .eq("id", row.id);

  const now = new Date();
  const rows = destinations.map((d) => {
    const moderated = source === "photographer" ? false : d === "screen" ? ev.moderate_screen : ev.moderate_album;
    const approved = !moderated;
    return {
      media_id: row.id,
      event_id: ev.id,
      destination: d,
      moderation: approved ? "approved" : "pending",
      approved_at: approved ? now.toISOString() : null,
      screen_expires_at:
        d === "screen" && approved ? new Date(now.getTime() + ev.screen_ttl_minutes * 60_000).toISOString() : null,
    };
  });
  if (rows.length) await db().from("media_destinations").upsert(rows, { onConflict: "media_id,destination" });

  if (message && destinations.includes("screen")) {
    await db().from("messages").insert({ event_id: ev.id, media_id: row.id, body: message });
  }
  return { ok: true };
}

/** Moderación: aprobar, rechazar o retirar sin tocar el archivo original. */
export async function moderate(
  ev: EventRow,
  mediaId: string,
  destination: Dest,
  action: "approve" | "reject" | "remove" | "feature" | "unfeature",
  actor: string,
) {
  const now = new Date();
  const patch: Record<string, unknown> =
    action === "approve"
      ? {
          moderation: "approved",
          approved_at: now.toISOString(),
          screen_expires_at:
            destination === "screen" ? new Date(now.getTime() + ev.screen_ttl_minutes * 60_000).toISOString() : null,
        }
      : action === "reject"
        ? { moderation: "rejected" }
        : action === "remove"
          ? { moderation: "removed" }
          : { featured: action === "feature" };
  await db().from("media_destinations").update(patch).eq("media_id", mediaId).eq("event_id", ev.id).eq("destination", destination);
  await db().from("moderation").insert({ event_id: ev.id, media_id: mediaId, destination, action, actor });
}

/** Moderación de mensajes sin foto. Nunca borra el mensaje: los anfitriones lo conservan. */
export async function moderateNote(ev: EventRow, messageId: string, action: "approve" | "reject" | "remove", actor: string) {
  const now = new Date();
  const patch =
    action === "approve"
      ? { moderation: "approved", approved_at: now.toISOString(), screen_expires_at: new Date(now.getTime() + ev.screen_ttl_minutes * 60_000).toISOString() }
      : { moderation: action === "reject" ? "rejected" : "removed" };
  await db().from("messages").update(patch).eq("id", messageId).eq("event_id", ev.id).is("media_id", null);
  await db().from("audit_logs").insert({ event_id: ev.id, actor_type: actor.startsWith("host") ? "host" : "admin", actor_id: actor, action: `note.${action}`, detail: { message: messageId } });
}
