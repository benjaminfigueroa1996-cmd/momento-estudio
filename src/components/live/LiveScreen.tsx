"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import ChatFeed from "./ChatFeed";
import PolaroidWall, { type WallCard } from "./PolaroidWall";
import { useOrientation, useScenes, PhotoCell, MessageCell, type Card, type PhotoCard, type Orient } from "./Composer";

type Data = {
  event: { name: string; hosts: string; type: string; date: string; tagline: string; logo: string | null; slideSeconds: number; step: number; dwell: number };
  state: { paused: boolean; layout: string; featured: string | null; showQr: boolean };
  guestUrl: string;
  items: { id: string; url: string; width: number | null; height: number | null; featured: boolean; message: string | null; at: string; playedAt: string | null }[];
  notes: { id: string; body: string; at: string; playedAt: string | null }[];
};

const AREAS = ["a", "b", "c", "d"];

/**
 * Pantalla del evento. Se adapta a pantallas horizontales, verticales, cuadradas y ultrapanorámicas,
 * y compone escenas con fotos y mensajes. Consulta el estado cada 4 s y se recupera sola si se corta internet.
 */
export default function LiveScreen({ slug, screenKey }: { slug: string; screenKey: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [offline, setOffline] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [qr, setQr] = useState("");
  const preloaded = useRef(new Set<string>());
  const orient = useOrientation();

  useEffect(() => {
    let stop = false;
    async function poll() {
      try {
        const r = await fetch(`/api/live/${slug}?k=${encodeURIComponent(screenKey)}`, { cache: "no-store" });
        if (r.status === 401) return setUnauthorized(true);
        if (!r.ok) throw new Error();
        const j: Data = await r.json();
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
    if (data?.guestUrl) QRCode.toDataURL(data.guestUrl, { margin: 1, width: 600, errorCorrectionLevel: "M", color: { dark: "#242321", light: "#FFFEFC" } }).then(setQr);
  }, [data?.guestUrl]);

  // Tarjetas: fotos y mensajes sin foto, con referencia estable mientras no cambie el contenido
  const signature = data ? data.items.map((i) => i.id).join() + "|" + data.notes.map((n) => n.id).join() : "";
  const cards: Card[] = useMemo(() => {
    if (!data) return [];
    return [
      ...data.items.map((i): PhotoCard => ({ kind: "photo", id: i.id, url: i.url, width: i.width, height: i.height, message: i.message, at: i.at })),
      ...data.notes.map((n): Card => ({ kind: "note", id: n.id, body: n.body, at: n.at })),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  // Muro de polaroids: tarjetas con su estado de reproducción
  const wallCards: WallCard[] = useMemo(() => {
    if (!data) return [];
    return [
      ...data.items.map((i): WallCard => ({ kind: "photo", id: i.id, url: i.url, width: i.width, height: i.height, message: i.message, at: i.at, playedAt: i.playedAt })),
      ...data.notes.map((n): WallCard => ({ kind: "note", id: n.id, body: n.body, at: n.at, playedAt: n.playedAt })),
    ].sort((a, b) => a.at.localeCompare(b.at));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, data?.items.filter((i) => i.playedAt).length, data?.notes.filter((n) => n.playedAt).length]);

  // Informa al servidor lo proyectado: no se vuelve a reproducir
  const markPlayed = useCallback((list: { kind: string; id: string }[]) => {
    const photos = list.filter((c) => c.kind === "photo").map((c) => c.id);
    const notes = list.filter((c) => c.kind === "note" && /^[0-9a-f-]{36}$/.test(c.id)).map((c) => c.id);
    if (!photos.length && !notes.length) return;
    fetch(`/api/live/${slug}/played?k=${encodeURIComponent(screenKey)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photos, notes }),
    }).catch(() => undefined);
  }, [slug, screenKey]);
  const [wallEmpty, setWallEmpty] = useState(true);
  const onEmpty = useCallback((e: boolean) => setWallEmpty(e), []);

  const layout = data?.state.layout ?? "auto";
  const force = ["full", "message", "mosaic"].includes(layout) ? layout : null;
  const paused = data?.state.paused ?? false;
  const scene = useScenes(cards, orient, data?.event.slideSeconds ?? 10, paused, force);
  const featured = data?.state.featured ? data.items.find((i) => i.id === data.state.featured) : undefined;
  const polaroid = layout === "auto";
  useEffect(() => { if (scene && !polaroid) markPlayed(scene.cards); }, [scene, polaroid, markPlayed]);

  if (unauthorized) {
    return <main className="flex h-dvh items-center justify-center bg-carbon text-marfil"><p className="text-2xl">Abre esta pantalla desde el panel de administración.</p></main>;
  }
  if (!data) return <main className="h-dvh bg-carbon" />;

  const ev = data.event;
  const showQr = data.state.showQr;
  const pendingNew = wallCards.some((c) => !c.playedAt);
  const waiting = polaroid ? wallEmpty && !pendingNew : cards.length === 0;
  const chat = layout === "chat" && data.items.length > 0;
  const side = orient === "landscape" || orient === "ultrawide";

  return (
    <main
      onDoubleClick={() => document.documentElement.requestFullscreen?.().catch(() => undefined)}
      className={`relative h-dvh w-screen cursor-none overflow-hidden bg-carbon text-marfil ${side ? "flex" : "flex flex-col"}`}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_110%,rgba(183,154,112,0.16),transparent_60%)]" />

      {/* Escenario */}
      <section className={`relative min-h-0 min-w-0 flex-1 ${side ? "p-[2.2vmin] pr-0" : "p-[2.2vmin] pb-0"}`}>
        {featured ? (
          <div className="grid h-full" key={`f-${featured.id}`}>
            <PhotoCell card={{ kind: "photo", id: featured.id, url: featured.url, width: featured.width, height: featured.height, message: featured.message, at: featured.at }} caption delay={0} />
          </div>
        ) : polaroid ? (
          <>
            <PolaroidWall cards={wallCards} orient={orient} step={ev.step} dwell={ev.dwell} paused={paused} onPlayed={markPlayed} onEmpty={onEmpty} />
            {waiting && <div className="absolute inset-0"><Waiting ev={ev} qr={qr} /></div>}
          </>
        ) : waiting ? (
          <Waiting ev={ev} qr={qr} />
        ) : chat ? (
          <div className="relative h-full overflow-hidden rounded-[1.4vmin]">
            <ChatFeed items={data.items} seconds={ev.slideSeconds} paused={paused} eventName={ev.hosts} />
          </div>
        ) : scene ? (
          <div
            key={scene.key}
            className="grid h-full gap-[1.6vmin]"
            style={{ gridTemplateColumns: scene.template.cols, gridTemplateRows: scene.template.rows, gridTemplateAreas: scene.template.areas }}
          >
            {scene.cards.map((c, i) => (
              <div key={c.id + i} className="min-h-0 min-w-0" style={{ gridArea: AREAS[i] }}>
                {c.kind === "photo" ? (
                  <PhotoCell card={c} caption={scene.template.cells.length > 1 && !scene.template.cells.includes("m")} delay={i * 140} />
                ) : (
                  <MessageCell body={c.body} fallback={ev.tagline} tone={c.id.endsWith("-m") ? "light" : "warm"} delay={i * 140} />
                )}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {/* Elementos permanentes: identidad, QR y firma */}
      {!waiting && <Rail ev={ev} qr={qr} showQr={showQr} orient={orient} />}

      {offline && <span className="absolute left-[1.2vmin] top-[1.2vmin] h-[1vmin] w-[1vmin] rounded-full bg-champagne/80" title="Reconectando" />}
      <style>{`
        @keyframes cell{from{opacity:0;transform:translateY(2.5vmin) scale(.985)}to{opacity:1;transform:none}}
        @keyframes drift{from{transform:scale(1.045)}to{transform:scale(1)}}
        @keyframes bubble{from{opacity:0;transform:translateY(6vh) scale(.96)}to{opacity:1;transform:none}}
      `}</style>
    </main>
  );
}

function Identity({ ev, align = "left" }: { ev: Data["event"]; align?: "left" | "center" }) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      {ev.logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ev.logo} alt="" className={`mb-[1.6vmin] max-h-[7vmin] max-w-[60%] object-contain ${align === "center" ? "mx-auto" : ""}`} />
      )}
      <p className="font-serif text-[3.4vmin] uppercase leading-[1.05] tracking-[0.08em] text-marfil">{ev.hosts}</p>
      <p className="mt-[1vmin] text-[1.5vmin] tracking-[0.35em] text-marfil/70">{ev.date}</p>
      <p className="mt-[1.4vmin] text-[1.5vmin] uppercase tracking-[0.3em] text-champagne">{ev.tagline}</p>
    </div>
  );
}

function QrTile({ qr, size }: { qr: string; size: string }) {
  if (!qr) return null;
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-[1.4vmin] bg-blanco p-[1.2vmin] shadow-[0_1.5vmin_4vmin_rgba(0,0,0,0.35)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="Código QR para compartir fotos" className="block" style={{ width: size, height: size }} />
      </div>
      <p className="mt-[1.2vmin] text-center text-[1.7vmin] font-medium text-marfil">¡Comparte tus fotos con nosotros!</p>
    </div>
  );
}

const Signature = () => <p className="font-serif text-[1.6vmin] tracking-[0.06em] text-marfil/45">Momento Estudio</p>;

function Rail({ ev, qr, showQr, orient }: { ev: Data["event"]; qr: string; showQr: boolean; orient: Orient }) {
  if (orient === "landscape" || orient === "ultrawide") {
    return (
      <aside className={`relative flex shrink-0 flex-col justify-between px-[3vmin] py-[4vmin] ${orient === "ultrawide" ? "w-[16vw]" : "w-[21vw]"}`}>
        <Identity ev={ev} />
        {showQr && <QrTile qr={qr} size={orient === "ultrawide" ? "11vw" : "15vw"} />}
        <Signature />
      </aside>
    );
  }
  // Vertical y cuadrada: franja inferior
  return (
    <aside className={`relative flex shrink-0 items-center justify-between gap-[3vmin] px-[3.5vmin] ${orient === "portrait" ? "h-[19vh]" : "h-[17vh]"}`}>
      <div className="flex h-full flex-col justify-center gap-[2vmin]">
        <Identity ev={ev} />
        <Signature />
      </div>
      {showQr && <QrTile qr={qr} size={orient === "portrait" ? "11vh" : "10vh"} />}
    </aside>
  );
}

/** Pantalla de espera: nunca queda negra. */
function Waiting({ ev, qr }: { ev: Data["event"]; qr: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-[5vmin] text-center animate-[cell_1200ms_cubic-bezier(0.22,1,0.36,1)_both]">
      {ev.logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ev.logo} alt="" className="max-h-[10vmin] object-contain" />
      )}
      <div>
        <p className="text-[1.8vmin] uppercase tracking-[0.4em] text-champagne">{ev.tagline}</p>
        <h1 className="mt-[2vmin] font-serif text-[8vmin] uppercase leading-[1] tracking-[0.05em] text-marfil">{ev.hosts}</h1>
        <p className="mt-[2vmin] text-[2.2vmin] tracking-[0.4em] text-marfil/70">{ev.date}</p>
      </div>
      <QrTile qr={qr} size="24vmin" />
      <p className="max-w-[60vmin] text-[2.2vmin] leading-snug text-marfil/70">Escanea el código con la cámara de tu teléfono y comparte tus fotos y mensajes en esta pantalla.</p>
      <Signature />
    </div>
  );
}
