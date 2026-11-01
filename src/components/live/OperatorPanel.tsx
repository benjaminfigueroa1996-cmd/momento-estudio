"use client";

import { useCallback, useEffect, useState } from "react";
import LiveControls, { type LiveState } from "./LiveControls";
import { postJSON } from "@/lib/client/image";

type Data = { event: { name: string }; liveUrl: string; state: LiveState; items: { id: string; thumb: string; message: string | null }[] };

// Pensado para usarse desde un teléfono junto a la pantalla
export default function OperatorPanel({ token }: { token: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const api = `/api/operador/${token}`;

  const load = useCallback(async () => {
    const r = await fetch(api, { cache: "no-store" });
    if (r.ok) { setData(await r.json()); setError(null); } else setError("Sin conexión o enlace revocado.");
  }, [api]);

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);

  const send = async (payload: object) => {
    try { await postJSON(api, payload); await load(); } catch (e) { setError((e as Error).message); }
  };

  if (!data) return <main className="p-8">{error ?? "Cargando…"}</main>;

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <p className="text-[13px] text-piedra">Operador de pantalla</p>
      <h1 className="mt-1 text-[40px] leading-tight">{data.event.name}</h1>
      <a href={data.liveUrl} target="_blank" className="mt-2 inline-block text-[14px] underline underline-offset-4">Abrir la pantalla en este dispositivo</a>
      {error && <p className="mt-4 text-[14px] text-[#8a3b2e]" role="alert">{error}</p>}

      <section className="mt-8"><LiveControls state={data.state} onChange={(p) => send(p)} /></section>

      <section className="mt-12">
        <h2 className="text-[28px]">En pantalla ahora</h2>
        {data.items.length === 0 && <p className="mt-3 text-piedra">No hay fotos en la rotación.</p>}
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.items.map((it) => (
            <li key={it.id} className="overflow-hidden rounded-xl border border-carbon/10 bg-blanco">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.thumb} alt="" className="aspect-square w-full object-cover" />
              {it.message && <p className="px-3 pt-2 text-[13px] leading-snug">“{it.message}”</p>}
              <div className="flex justify-between px-3 py-2 text-[14px]">
                <button className="underline" onClick={() => send({ featured_media_id: it.id })}>Destacar</button>
                <button className="underline" onClick={() => send({ remove: it.id })}>Retirar</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
