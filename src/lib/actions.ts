"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, audit } from "./db";
import { requireAdmin } from "./admin";

const toDate = (v: FormDataEntryValue | null) => (v && String(v) ? new Date(String(v)).toISOString() : null);
const bool = (v: FormDataEntryValue | null) => v === "on";

const eventSchema = z.object({
  name: z.string().trim().min(2).max(120),
  hosts_names: z.string().trim().min(2).max(160),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{2,60}$/, "El enlace solo puede tener minúsculas, números y guiones"),
  starts_at: z.string().min(10),
  city: z.string().trim().max(80).optional(),
  screen_slide_seconds: z.coerce.number().int().min(3).max(120),
  screen_ttl_minutes: z.coerce.number().int().min(1).max(1440),
  max_uploads_per_guest: z.coerce.number().int().min(1).max(500),
  max_file_mb: z.coerce.number().int().min(1).max(200),
  event_type: z.enum(["matrimonio", "cumpleanos", "celebracion", "corporativo", "otro"]),
  tagline: z.string().trim().max(60).optional(),
});

function readEvent(f: FormData) {
  const base = eventSchema.parse({
    name: f.get("name"), hosts_names: f.get("hosts_names"), slug: f.get("slug"), starts_at: f.get("starts_at"),
    city: f.get("city") || undefined, screen_slide_seconds: f.get("screen_slide_seconds"), screen_ttl_minutes: f.get("screen_ttl_minutes"),
    max_uploads_per_guest: f.get("max_uploads_per_guest"), max_file_mb: f.get("max_file_mb"),
    event_type: f.get("event_type") || "matrimonio", tagline: String(f.get("tagline") ?? ""),
  });
  return {
    ...base,
    starts_at: new Date(base.starts_at).toISOString(),
    tagline: base.tagline || null,
    timezone: "America/Santiago",
    moderate_screen: bool(f.get("moderate_screen")),
    moderate_album: bool(f.get("moderate_album")),
    hosts_can_moderate: bool(f.get("hosts_can_moderate")),
    album_enabled: bool(f.get("album_enabled")),
    guest_downloads: bool(f.get("guest_downloads")),
    uploads_close_at: toDate(f.get("uploads_close_at")),
    album_until: toDate(f.get("album_until")),
    host_access_until: toDate(f.get("host_access_until")),
    retention_until: toDate(f.get("retention_until")),
  };
}

export async function createEvent(f: FormData) {
  const user = await requireAdmin();
  const row = readEvent(f);
  const { data, error } = await db().from("events").insert(row).select("id").single();
  if (error) throw new Error(error.code === "23505" ? "Ese enlace ya está en uso." : "No se pudo crear el evento.");
  const id = (data as { id: string }).id;
  await db().from("live_state").insert({ event_id: id });
  await audit(id, "admin", user.id, "event.created");
  redirect(`/admin/eventos/${id}`);
}

export async function updateEvent(id: string, f: FormData) {
  const user = await requireAdmin();
  await db().from("events").update(readEvent(f)).eq("id", id);
  await audit(id, "admin", user.id, "event.updated");
  revalidatePath(`/admin/eventos/${id}`);
}

export async function saveSettings(f: FormData) {
  await requireAdmin();
  const keys = ["contact_email", "contact_phone", "contact_instagram"];
  for (const key of keys) {
    const value = String(f.get(key) ?? "").trim().slice(0, 200);
    if (value) await db().from("settings").upsert({ key, value, updated_at: new Date().toISOString() });
    else await db().from("settings").delete().eq("key", key);
  }
  revalidatePath("/admin/configuracion");
}

export async function setQuoteStatus(id: string, status: string) {
  await requireAdmin();
  await db().from("quote_requests").update({ status }).eq("id", id);
  revalidatePath("/admin/cotizaciones");
}
