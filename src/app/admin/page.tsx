import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  await requireAdmin();
  const now = new Date();
  const [{ data: events }, { data: counts }, { count: pending }, { count: quotes }, { data: errors }] = await Promise.all([
    db().from("events").select("id, slug, name, hosts_names, starts_at, city").order("starts_at", { ascending: false }).limit(100),
    db().from("media").select("event_id, source, bytes").eq("status", "ready").limit(100000),
    db().from("media_destinations").select("media_id", { count: "exact", head: true }).eq("moderation", "pending"),
    db().from("quote_requests").select("id", { count: "exact", head: true }).eq("status", "nueva"),
    db().from("photographer_uploads").select("id").eq("status", "error").limit(1000),
  ]);
  const media = (counts ?? []) as { event_id: string; source: string; bytes: number | null }[];
  const gb = media.reduce((a, m) => a + (m.bytes ?? 0), 0) / 1024 ** 3;
  const list = (events ?? []) as { id: string; slug: string; name: string; hosts_names: string; starts_at: string; city: string | null }[];
  const day = 864e5;
  const groups = {
    "En curso": list.filter((e) => Math.abs(new Date(e.starts_at).getTime() - now.getTime()) < day),
    Próximos: list.filter((e) => new Date(e.starts_at).getTime() - now.getTime() >= day),
    Finalizados: list.filter((e) => now.getTime() - new Date(e.starts_at).getTime() >= day),
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <dl className="grid grid-cols-2 gap-6 border-b border-carbon/10 pb-8 md:grid-cols-5">
        {[
          ["Fotos recibidas", media.length],
          ["Del fotógrafo", media.filter((m) => m.source === "photographer").length],
          ["Pendientes de aprobar", pending ?? 0],
          ["Cotizaciones nuevas", quotes ?? 0],
          ["Almacenamiento", `${gb.toFixed(1)} GB`],
        ].map(([k, v]) => (
          <div key={k as string}><dt className="text-[13px] text-piedra">{k}</dt><dd className="mt-1 font-serif text-[34px] leading-none">{v}</dd></div>
        ))}
      </dl>
      {(errors?.length ?? 0) > 0 && <p className="mt-6 text-[14px] text-[#8a3b2e]">{errors!.length} cargas del fotógrafo con error. Revisa el evento correspondiente.</p>}

      {Object.entries(groups).map(([title, evs]) => (
        <section key={title} className="mt-12">
          <h2 className="text-[28px]">{title}</h2>
          {evs.length === 0 ? <p className="mt-3 text-[15px] text-piedra">Sin eventos.</p> : (
            <ul className="mt-4 divide-y divide-carbon/10 border-y border-carbon/10">
              {evs.map((e) => (
                <li key={e.id}>
                  <Link href={`/admin/eventos/${e.id}`} className="flex items-baseline justify-between gap-6 py-4 hover:bg-marfil">
                    <span><span className="text-[17px]">{e.name}</span><span className="ml-3 text-[14px] text-piedra">{e.hosts_names}</span></span>
                    <span className="text-[14px] tabular-nums text-piedra">
                      {new Date(e.starts_at).toLocaleDateString("es-CL", { timeZone: "America/Santiago", day: "numeric", month: "short", year: "numeric" })}
                      {" · "}{media.filter((m) => m.event_id === e.id).length} fotos
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </main>
  );
}
