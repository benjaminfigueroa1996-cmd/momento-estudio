"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import ChatFeed from "./ChatFeed";

type Item = { id: string; url: string; width: number | null; height: number | null; featured: boolean; message: string | null };
type Data = {
  event: { name: string; hosts: string; slideSeconds: number };
  state: { paused: boolean; layout: string; featured: string | null; showQr: boolean };
  guestUrl: string;
  items: Item[];
};

/**
 * Pantalla 1920×1080 (se adapta a otras proporciones).
 * Consulta el estado cada 4 s; si se cae internet sigue mostrando lo último que tenía.
 */
export default function LiveScreen({ slug, screenKey }: { slug: string; screenKey: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [offline, setOffline] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [index, setIndex] = useState(0);
  const [qr, setQr] = useState<string>("");
  const preloaded = useRef(new Set<string>());

  useEffect(() => {
    let stop = false;
    async function poll() {
      try {
        const r = await fetch(`/api/live/${slug}?k=${encodeURIComponent(screenKey)}`, { cache: "no-store" });
        if (r.status === 401) return setUnauthorized(true);
        if (!r.ok) throw new Error();
        const j: Data = await r.json();
        // precarga para transiciones sin saltos
        j.items.forEach((it) => { if (!preloaded.current.has(it.id)) { new Image().src = it.url; preloaded.current.add(it.id); } });
        setData(j);
        setOffline(false);
      } catch {
        setOffline(true);
      }
      if (!stop) setTimeout(poll, 4000);
    }
    poll();
    return () => { stop = true; };
  }, [slug, screenKey]);

  useEffect(() => {
    if (data?.guestUrl) QRCode.toDataURL(data.guestUrl, { margin: 1, width: 360, color: { dark: "#242321", light: "#FFFEFC" } }).then(setQr);
  }, [data?.guestUrl]);

  const items = data?.items ?? [];
  const seconds = data?.event.slideSeconds ?? 10;
  const paused = data?.state.paused ?? false;

  useEffect(() => {
    if (paused || items.length < 2) return;
    const t = setInterval(() => setIndex((i) => i + 1), seconds * 1000);
    return () => clearInterval(t);
  }, [paused, items.length, seconds]);

  const featured = data?.state.featured ? items.find((i) => i.id === data.state.featured) : undefined;
  const current = featured ?? (items.length ? items[index % items.length] : undefined);
  const layout = featured ? "featured" : data?.state.layout ?? "auto";

  // En modo automático se alterna: foto con mensaje cuando lo hay, mosaico cada cierto tiempo
  // El diseño principal es la conversación; los demás se eligen desde el panel
  const effective = useMemo(() => (layout === "auto" ? "chat" : layout), [layout]);

  async function goFullscreen() {
    await document.documentElement.requestFullscreen?.().catch(() => undefined);
  }

  if (unauthorized) {
    return <main className="flex h-dvh items-center justify-center bg-carbon text-blanco"><p className="text-2xl">Abre esta pantalla desde el panel de administración.</p></main>;
  }

  return (
    <main onDoubleClick={goFullscreen} className="relative h-dvh w-screen cursor-none overflow-hidden bg-carbon text-blanco">
      {!current && data && (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <p className="text-[1.6vw] text-blanco/60">Momento Estudio</p>
          <h1 className="mt-4 text-[5vw] leading-none">{data.event.name}</h1>
          <p className="mt-6 text-[1.8vw] text-blanco/70">Escanea el código y comparte tus fotos en esta pantalla</p>
        </div>
      )}

      {current && effective === "chat" && (
        <ChatFeed items={items} seconds={seconds} paused={paused} eventName={data?.event.name ?? ""} />
      )}

      {current && effective === "mosaic" && (
        <div className="grid h-full grid-cols-4 grid-rows-2 gap-[0.4vw] p-[0.4vw]">
          {items.slice(-8).map((it) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={it.id} src={it.url} alt="" className="h-full w-full object-cover animate-[fade_900ms_ease-out]" />
          ))}
        </div>
      )}

      {current && effective === "gallery" && (
        <div className="flex h-full items-center gap-[2vw] px-[3vw]">
          {[0, 1, 2].map((k) => {
            const it = items[(index + k) % items.length];
            // eslint-disable-next-line @next/next/no-img-element
            return it ? <img key={`${it.id}-${k}`} src={it.url} alt="" className={`h-[70vh] flex-1 rounded-[0.6vw] object-cover transition-all duration-700 ${k === 1 ? "h-[84vh]" : "opacity-70"}`} /> : null;
          })}
        </div>
      )}

      {current && (effective === "full" || effective === "featured") && (
        <Slide key={current.id} item={current} contain={effective === "featured"} />
      )}

      {current && effective === "message" && (
        <div key={current.id} className="grid h-full grid-cols-[1.35fr_1fr] animate-[fade_900ms_ease-out]">
          <div className="relative overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div className="flex flex-col justify-center bg-marfil px-[5vw] text-carbon">
            <p className="font-serif text-[3.4vw] leading-[1.15]">“{current.message ?? data?.event.hosts}”</p>
            <p className="mt-[3vh] text-[1.1vw] text-piedra">{data?.event.name}</p>
          </div>
        </div>
      )}

      {data?.state.showQr && qr && (
        <div className="absolute bottom-[3vh] right-[2vw] flex items-center gap-[1vw] rounded-[1vw] bg-blanco/95 p-[0.8vw] pr-[1.4vw] text-carbon shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Código QR para compartir fotos" className="h-[9vw] w-[9vw]" />
          <p className="max-w-[11vw] text-[1vw] leading-snug">Escanea y comparte tus fotos en esta pantalla</p>
        </div>
      )}

      {offline && <span className="absolute left-[1.5vw] top-[1.5vh] h-[0.6vw] w-[0.6vw] rounded-full bg-champagne/80" title="Reconectando" />}
      <style>{`@keyframes fade{from{opacity:0}to{opacity:1}} @keyframes drift{from{transform:scale(1.04)}to{transform:scale(1.0)}} @keyframes bubble{from{opacity:0;transform:translateY(6vh) scale(0.96)}to{opacity:1;transform:none}}`}</style>
    </main>
  );
}

function Slide({ item, contain }: { item: Item; contain: boolean }) {
  return (
    <div className="absolute inset-0 animate-[fade_900ms_ease-out]">
      {/* fondo desenfocado para fotos verticales en pantalla horizontal */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.url} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-3xl" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.url} alt="" className={`relative h-full w-full ${contain ? "object-contain p-[3vh]" : "object-contain"} animate-[drift_12s_ease-out_forwards]`} />
      {item.message && !contain && (
        <p className="absolute bottom-[6vh] left-[4vw] max-w-[50vw] font-serif text-[2.6vw] leading-tight drop-shadow-[0_2px_20px_rgba(0,0,0,.6)]">“{item.message}”</p>
      )}
    </div>
  );
}
