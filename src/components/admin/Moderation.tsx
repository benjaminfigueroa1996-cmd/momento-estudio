"use client";

import { useCallback, useEffect, useState } from "react";
import { postJSON } from "@/lib/client/image";

type Item = { mediaId: string; destination: "screen" | "album"; featured: boolean; source: string; message: string | null; thumb: string; display: string };

export default function Moderation({ eventId }: { eventId: string }) {
  const [estado, setEstado] = useState<"pending" | "approved" | "rejected">("pending");
  const [items, setItems] = useState<Item[]>([]);
  const [notes, setNotes] = useState<{ id: string; body: string }[]>([]);
  const base = `/api/admin/eventos/${eventId}`;

  const load = useCallback(async () => {
    const r = await fetch(`${base}/moderacion?estado=${estado}`);
    if (r.ok) { const j = await r.json(); setItems(j.items); setNotes(j.notes ?? []); }
  }, [base, estado]);

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]);

  async function act(it: Item, action: string) {
    await postJSON(`${base}/moderacion`, { mediaId: it.mediaId, destination: it.destination, action });
    if (action === "feature") await postJSON(`${base}/pantalla`, { featured_media_id: it.mediaId });
    load();
  }

  return (
    <div className="mt-4">
      <div className="flex gap-1">
        {([["pending", "Pendientes"], ["approved", "Publicadas"], ["rejected", "Rechazadas"]] as const).map(([k, v]) => (
          <button key={k} onClick={() => setEstado(k)} className={`rounded-full px-4 py-2 text-[14px] ${estado === k ? "bg-carbon text-blanco" : "hover:bg-beige"}`}>{v}</button>
        ))}
      </div>
      {notes.length > 0 && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-xl border border-carbon/10 bg-marfil p-4 text-[14px]">
              <p className="text-piedra">Mensaje sin foto · pantalla</p>
              <p className="mt-1 font-serif text-[19px] leading-snug">“{n.body}”</p>
              <div className="mt-3 flex gap-3">
                {estado !== "approved" && <button className="font-medium underline" onClick={async () => { await postJSON(`${base}/moderacion`, { messageId: n.id, action: "approve" }); load(); }}>Aprobar</button>}
                {estado === "pending" && <button className="underline" onClick={async () => { await postJSON(`${base}/moderacion`, { messageId: n.id, action: "reject" }); load(); }}>Rechazar</button>}
                {estado === "approved" && <button className="underline" onClick={async () => { await postJSON(`${base}/moderacion`, { messageId: n.id, action: "remove" }); load(); }}>Retirar</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {items.length === 0 && notes.length === 0 && <p className="mt-6 text-[15px] text-piedra">Nada por aquí.</p>}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <li key={`${it.mediaId}-${it.destination}`} className="overflow-hidden rounded-xl border border-carbon/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.thumb} alt="" className="aspect-[4/3] w-full bg-beige object-cover" />
            <div className="p-4 text-[14px]">
              <p className="text-piedra">{it.destination === "screen" ? "Pantalla" : "Álbum"} · {it.source === "station" ? "iPad" : it.source === "photographer" ? "Fotógrafo" : "Invitado"}</p>
              {it.message && <p className="mt-1 font-serif text-[19px] leading-snug">“{it.message}”</p>}
              <div className="mt-3 flex flex-wrap gap-3">
                {estado !== "approved" && <button className="font-medium underline" onClick={() => act(it, "approve")}>Aprobar</button>}
                {estado === "pending" && <button className="underline" onClick={() => act(it, "reject")}>Rechazar</button>}
                {estado === "approved" && <button className="underline" onClick={() => act(it, "remove")}>Retirar</button>}
                {estado === "approved" && it.destination === "screen" && <button className="underline" onClick={() => act(it, "feature")}>Destacar en pantalla</button>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
