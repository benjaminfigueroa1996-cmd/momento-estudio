import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Cliente con clave de servicio: solo en el servidor, siempre filtrando por event_id.
// Sin tipos generados de la base: el cliente acepta cualquier tabla (evita el tipo "never").
const makeClient = () =>
  createClient<any>(env.supabaseUrl(), env.supabaseService(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
let client: ReturnType<typeof makeClient> | null = null;
export function db() {
  if (!client) {
    client = makeClient();
  }
  return client;
}
export type EventRow = {
  id: string;
  slug: string;
  name: string;
  hosts_names: string;
  starts_at: string;
  timezone: string;
  city: string | null;
  cover_key: string | null;
  theme: Record<string, string>;
  screen_key: string;
  screen_slide_seconds: number;
  screen_ttl_minutes: number;
  moderate_screen: boolean;
  moderate_album: boolean;
  album_enabled: boolean;
  guest_downloads: boolean;
  max_uploads_per_guest: number;
  max_file_mb: number;
  uploads_close_at: string | null;
  album_until: string | null;
  host_access_until: string | null;
  retention_until: string | null;
  hosts_can_moderate: boolean;
  event_type: "matrimonio" | "cumpleanos" | "celebracion" | "corporativo" | "otro";
  tagline: string | null;
  logo_key: string | null;
};

export async function getEventBySlug(slug: string): Promise<EventRow | null> {
  const { data } = await db().from("events").select("*").eq("slug", slug).maybeSingle();
  return (data as EventRow | null) ?? null;
}

export async function audit(
  eventId: string | null,
  actorType: "admin" | "host" | "guest" | "photographer" | "device" | "system",
  actorId: string | null,
  action: string,
  detail: Record<string, unknown> = {},
) {
  await db().from("audit_logs").insert({ event_id: eventId, actor_type: actorType, actor_id: actorId, action, detail });
}

export function uploadsOpen(ev: EventRow) {
  return !ev.uploads_close_at || new Date(ev.uploads_close_at) > new Date();
}
export function albumOpen(ev: EventRow) {
  return ev.album_enabled && (!ev.album_until || new Date(ev.album_until) > new Date());
}
