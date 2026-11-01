"use client";

import { useCallback, useEffect, useState } from "react";

type Item = {
  id: string; source: string; thumb: string; display: string;
  destinations: { destination: string; moderation: string; onScreenNow: boolean }[];
  messages: string[]; originalOf: string | null; createdAt: string;
};

const FILTERS = [
  { id: "todas", label: "Todas" },
  { id: "pantalla", label: "Historias en pantalla" },
  { id: "album", label: "Álbum compartido" },
  { id: "fotografo", label: "Fotógrafo" },
  { id: "intervenidas", label: "Intervenidas" },
  { id: "mensajes", label: "Mensajes" },
] as const;

export default function HostPanel({ slug, name, hosts, stats }: { slug: string; name: string; hosts: string; stats: { total: number; pro: number; edited: number; messages: number } }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("todas");
  const [items, setItems] = useState<Item[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [open, setOpen] = useState<Item | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<{ mediaId: string; destination: string; message: string | null; thumb: string }[]>([]);

  const loadPending = useCallback(async () => {
    const r = await fetch(`/api/anfitriones/${slug}/moderacion`);
    setPending(r.ok ? (await r.json()).items : []);
  }, [slug]);
  useEffect(() => { loadPending(); const t = setInterval(loadPending, 10000); return () => clearInterval(t); }, [loadPending]);

  async function decide(mediaId: string, destination: string, action: "approve" | "reject") {
    await fetch(`/api/anfitriones/${slug}/moderacion`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mediaId, destination, action }) });
    loadPending();
  }

  const load = useCallback(async (reset: boolean, before?: string | null) => {
    const f = filter === "mensajes" ? "pantalla" : filter;
    const r = await fetch(`/api/anfitriones/${slug}/media?f=${f}${before ? `&before=${encodeURIComponent(before)}` : ""}`);
    if (r.status === 401) return location.reload();
    const j = await r.json();
    const list: Item[] = filter === "mensajes" ? j.items.filter((x: Item) => x.messages.length) : j.items;
    setItems((prev) => (reset ? list : [...prev, ...list]));
    setNext(j.next);
  }, [filter, slug]);

  useEffect(() => { setSelected(new Set()); load(true); }, [load]);

  async function downloadSelected() {
    // Descargas una a una (el navegador las guarda en la carpeta de descargas)
    for (const id of selected) {
      const a = document.createElement("a");
      a.href = `/api/anfitriones/${slug}/descargar/${id}`;
      a.click();
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  const label = (it: Item) => {
    if (it.source === "photographer") return "Fotógrafo oficial";
    if (it.source === "station") return "Intervenida en el iPad";
    const d = it.destinations.map((x) => x.destination);
    return d.includes("screen") && d.includes("album") ? "Pantalla y álbum" : d.includes("screen") ? "Solo pantalla" : "Álbum";
  };

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-12 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[13px] text-piedra">Archivo privado</p>
          <h1 className="mt-2 text-[44px] leading-tight md:text-[56px]">{name}</h1>
          <p className="mt-1 text-carbon/70">{hosts}</p>
        </div>
        <div className="flex gap-3">
          <a className="btn-primary" href={`/api/anfitriones/${slug}/zip`}>Descargar todo (ZIP)</a>
          <button className="btn-quiet" onClick={async () => { await fetch(`/api/anfitriones/${slug}/salir`, { method: "POST" }); location.reload(); }}>Salir</button>
        </div>
      </header>

      <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-4 border-y border-carbon/10 py-6 md:grid-cols-4">
        {[["Fotos", stats.total], ["Del fotógrafo", stats.pro], ["Intervenidas", stats.edited], ["Mensajes", stats.messages]].map(([k, v]) => (
          <div key={k as string}><dt className="text-[13px] text-piedra">{k}</dt><dd className="font-serif text-[34px] leading-none">{v}</dd></div>
        ))}
      </dl>

      {pending.length > 0 && (
        <section className="mt-10 rounded-2xl border border-champagne/50 bg-marfil p-5">
          <h2 className="text-[26px]">Por aprobar ({pending.length})</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {pending.map((p) => (
              <li key={`${p.mediaId}-${p.destination}`} className="text-[13px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumb} alt="" className="aspect-square w-full rounded-md object-cover" />
                <p className="mt-1 text-piedra">{p.destination === "screen" ? "Para la pantalla" : "Para el álbum"}</p>
                {p.message && <p className="leading-snug">“{p.message}”</p>}
                <div className="mt-1 flex gap-3"><button className="font-medium underline" onClick={() => decide(p.mediaId, p.destination, "approve")}>Aprobar</button>
                  <button className="underline" onClick={() => decide(p.mediaId, p.destination, "reject")}>Rechazar</button></div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="-mx-1 mt-8 flex gap-1 overflow-x-auto pb-2" aria-label="Filtrar">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`shrink-0 rounded-full px-4 py-2 text-[14px] ${filter === f.id ? "bg-carbon text-blanco" : "text-carbon/70 hover:bg-beige"}`}>{f.label}</button>
        ))}
      </nav>

      {selected.size > 0 && (
        <div className="sticky top-3 z-10 mt-4 flex items-center justify-between rounded-full bg-carbon px-5 py-2 text-[14px] text-blanco">
          <span>{selected.size} seleccionadas</span>
          <span className="flex gap-4"><button onClick={downloadSelected}>Descargar</button><button onClick={() => setSelected(new Set())}>Cancelar</button></span>
        </div>
      )}

      {filter === "mensajes" ? (
        <ul className="mt-6 divide-y divide-carbon/10">
          {items.map((it) => (
            <li key={it.id} className="flex gap-5 py-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.thumb} alt="" className="h-20 w-20 rounded-lg object-cover" />
              <div>{it.messages.map((m, i) => <p key={i} className="font-serif text-[22px] leading-snug">“{m}”</p>)}
                <p className="mt-1 text-[13px] text-piedra">{new Date(it.createdAt).toLocaleString("es-CL")}</p></div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it) => (
            <figure key={it.id} className="group relative">
              <button onClick={() => setOpen(it)} className="block aspect-square w-full overflow-hidden rounded-md bg-beige">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
              <input type="checkbox" aria-label="Seleccionar" checked={selected.has(it.id)}
                onChange={(e) => setSelected((s) => { const n = new Set(s); e.target.checked ? n.add(it.id) : n.delete(it.id); return n; })}
                className="absolute left-2 top-2 h-5 w-5 accent-carbon opacity-70 group-hover:opacity-100" />
              <figcaption className="mt-1.5 text-[12px] text-piedra">{label(it)}{it.messages.length ? " · con mensaje" : ""}</figcaption>
            </figure>
          ))}
        </div>
      )}
      {next && <button className="btn-quiet mt-10" onClick={() => load(false, next)}>Cargar más</button>}
      {!items.length && <p className="mt-10 text-carbon/70">Aún no hay fotos en esta sección.</p>}

      {open && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex flex-col bg-carbon/95 text-blanco" onClick={() => setOpen(null)}>
          <div className="flex justify-between p-4 text-[15px]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(null)}>Cerrar</button>
            <a href={`/api/anfitriones/${slug}/descargar/${open.id}`}>Descargar original</a>
          </div>
          <div className="flex flex-1 items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={open.display} alt="" className="max-h-full max-w-full object-contain" />
          </div>
          {open.messages[0] && <p className="px-6 pb-8 text-center font-serif text-[24px]">“{open.messages[0]}”</p>}
        </div>
      )}
    </main>
  );
}
