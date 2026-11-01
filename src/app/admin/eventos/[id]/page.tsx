import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db, type EventRow } from "@/lib/db";
import { updateEvent } from "@/lib/actions";
import { env } from "@/lib/env";
import EventForm from "@/components/admin/EventForm";
import EventTools from "@/components/admin/EventTools";
import Moderation from "@/components/admin/Moderation";

export const dynamic = "force-dynamic";

export default async function EventAdmin({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { data } = await db().from("events").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const ev = data as EventRow;
  const [{ data: links }, { data: devices }, { data: live }, { data: logs }, { data: access }, { data: operators }] = await Promise.all([
    db().from("photographer_links").select("id, name, revoked_at, created_at").eq("event_id", id).order("created_at"),
    db().from("device_sessions").select("id, name, last_seen_at, revoked_at, token_hash").eq("event_id", id).order("created_at"),
    db().from("live_state").select("*").eq("event_id", id).maybeSingle(),
    db().from("audit_logs").select("actor_type, action, created_at").eq("event_id", id).order("created_at", { ascending: false }).limit(25),
    db().from("couple_access").select("id, created_at").eq("event_id", id).is("revoked_at", null).limit(1),
    db().from("operator_links").select("id, name, revoked_at").eq("event_id", id).order("created_at"),
  ]);
  const site = env.siteUrl();
  const save = updateEvent.bind(null, id);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-[13px] text-piedra">{new Date(ev.starts_at).toLocaleString("es-CL", { timeZone: ev.timezone, dateStyle: "full", timeStyle: "short" })}</p>
      <h1 className="mt-1 text-[48px] leading-tight">{ev.name}</h1>
      <p className="text-carbon/70">{ev.hosts_names}{ev.city ? ` · ${ev.city}` : ""}</p>

      <EventTools
        eventId={id}
        urls={{
          guests: `${site}/e/${ev.slug}`,
          album: `${site}/e/${ev.slug}/album`,
          live: `${site}/live/${ev.slug}?k=${encodeURIComponent(ev.screen_key)}`,
          hosts: `${site}/anfitriones/${ev.slug}`,
        }}
        hasHostAccess={(access ?? []).length > 0}
        operators={(operators ?? []) as { id: string; name: string; revoked_at: string | null }[]}
        hasCover={!!ev.cover_key}
        links={(links ?? []) as { id: string; name: string; revoked_at: string | null }[]}
        devices={((devices ?? []) as { id: string; name: string; last_seen_at: string | null; revoked_at: string | null; token_hash: string | null }[]).map((d) => ({ ...d, paired: !!d.token_hash, token_hash: undefined }))}
        live={(live as { paused: boolean; layout: string; show_qr: boolean; featured_media_id: string | null } | null) ?? { paused: false, layout: "auto", show_qr: true, featured_media_id: null }}
      />

      <section className="mt-16">
        <h2 className="text-[32px]">Moderación</h2>
        <Moderation eventId={id} />
      </section>

      <section className="mt-16">
        <h2 className="text-[32px]">Configuración</h2>
        <div className="mt-6"><EventForm action={save} ev={ev} submit="Guardar cambios" /></div>
      </section>

      <section className="mt-16">
        <h2 className="text-[32px]">Actividad reciente</h2>
        <ul className="mt-4 divide-y divide-carbon/10 text-[14px]">
          {((logs ?? []) as { actor_type: string; action: string; created_at: string }[]).map((l, i) => (
            <li key={i} className="flex justify-between py-2"><span>{l.action} <span className="text-piedra">({l.actor_type})</span></span>
              <span className="tabular-nums text-piedra">{new Date(l.created_at).toLocaleString("es-CL", { timeZone: "America/Santiago" })}</span></li>
          ))}
        </ul>
      </section>
    </main>
  );
}
