import { downloadZip } from "client-zip";
import { db, getEventBySlug, audit } from "@/lib/db";
import { hostSession } from "@/lib/session";
import { stream } from "@/lib/r2";
import { fail } from "@/lib/guard";

export const maxDuration = 300; // segundos; ver docs/decisiones.md sobre eventos muy grandes

/**
 * Descarga completa en ZIP, generada en flujo (no se guarda una copia en el servidor).
 * Cada original aparece UNA vez; una foto con pantalla y álbum va en Album_Compartido
 * y queda marcada en Mensajes/indice.csv.
 */
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ev = await getEventBySlug(slug);
  if (!ev) return fail("Evento no encontrado.", 404);
  const s = await hostSession(ev.id);
  if (!s) return fail("Ingresa con tu código.", 401);

  const all: { id: string; source: string; original_key: string; created_at: string; media_destinations: { destination: string }[]; messages: { body: string }[] }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await db()
      .from("media")
      .select("id, source, original_key, created_at, media_destinations(destination), messages(body)")
      .eq("event_id", ev.id)
      .eq("status", "ready")
      .order("created_at")
      .range(from, from + 999);
    const page = (data ?? []) as unknown as typeof all;
    all.push(...page);
    if (page.length < 1000) break;
  }

  const root = `Momento_Estudio_${ev.slug}`;
  const folder = (m: (typeof all)[number]) => {
    const d = m.media_destinations.map((x) => x.destination);
    if (m.source === "photographer") return "Fotografo_Oficial";
    if (m.source === "station") return "Fotografias_Intervenidas";
    if (d.includes("album")) return "Album_Compartido";
    if (d.includes("screen")) return "Historias_Pantalla";
    return "Sin_Destino";
  };
  const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const index = ["archivo,carpeta,destinos,origen,fecha,mensaje"];
  const files = all.map((m, i) => {
    const ext = m.original_key.split(".").pop();
    const name = `${String(i + 1).padStart(4, "0")}_${m.id.slice(0, 8)}.${ext}`;
    const dir = folder(m);
    index.push([name, dir, m.media_destinations.map((d) => d.destination).join("+"), m.source, m.created_at, m.messages.map((x) => x.body).join(" | ")].map(csvCell).join(","));
    return { name: `${root}/${dir}/${name}`, key: m.original_key, lastModified: new Date(m.created_at) };
  });

  async function* entries() {
    yield { name: `${root}/Mensajes/indice.csv`, input: "\uFEFF" + index.join("\n") };
    for (const f of files) yield { name: f.name, lastModified: f.lastModified, input: await stream(f.key) };
  }

  await db().from("export_jobs").insert({ event_id: ev.id, requested_by: `host:${s.accessId}`, files_count: files.length });
  await audit(ev.id, "host", s.accessId, "host.export_zip", { files: files.length });

  const res = downloadZip(entries());
  return new Response(res.body, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${root}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
