"use client";

import { useEffect, useRef, useState } from "react";
import type { Orient } from "./Composer";

export type WallPhoto = { kind: "photo"; id: string; url: string; width: number | null; height: number | null; message: string | null; at: string; playedAt: string | null };
export type WallNote = { kind: "note"; id: string; body: string; at: string; playedAt: string | null };
export type WallCard = WallPhoto | WallNote;

type Floating = { card: WallCard; lane: number; t0: number; x: number; r: number; w: number; h: number; fresh: boolean; side: "left" | "right"; tone: number };

/**
 * Muro de recuerdos que sube: cada foto o mensaje entra por abajo, sube lentamente y sale por arriba.
 * Se muestra UNA sola vez (se informa al servidor al entrar) y nunca vuelve.
 * Columnas según la pantalla: 2 en pantallas altas, 3 en horizontales, 4 en ultra anchas.
 */
export default function PolaroidWall({
  cards, orient, dwell, paused, onPlayed, onEmpty,
}: {
  cards: WallCard[]; orient: Orient; step?: number; dwell: number; paused: boolean;
  onPlayed: (c: WallCard[]) => void; onEmpty: (empty: boolean) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ W: 0, H: 0 });
  const sizeRef = useRef(size);
  const [wall, setWall] = useState<Floating[]>([]);
  const wallRef = useRef<Floating[]>([]);
  const els = useRef(new Map<string, HTMLDivElement>());
  const used = useRef(new Set<string>());
  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const onPlayedRef = useRef(onPlayed);
  onPlayedRef.current = onPlayed;
  const clock = useRef(performance.now() / 1000); // reloj que se detiene al pausar
  const lastSpawn = useRef<Floating | null>(null);
  const nextStagger = useRef(0.5);
  const restored = useRef(false);
  const noteCount = useRef(0);

  const lanesFor = (W: number, H: number) => {
    if (!W || !H) return orient === "portrait" ? 2 : 3;
    const r = W / H;
    return r < 0.95 ? 2 : r < 1.9 ? 3 : 4;
  };

  // Tamaño real del escenario
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const s = { W: e.contentRect.width, H: e.contentRect.height };
      sizeRef.current = s;
      setSize(s);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const place = (card: WallCard, lane: number, t0: number, fresh: boolean): Floating => {
    const { W, H } = sizeRef.current;
    const lanes = lanesFor(W, H);
    const laneW = W / lanes;
    // a veces ordenadas, a veces más sueltas: tamaño, desfase e inclinación variables
    const loose = Math.random() < 0.55;
    const w = laneW * (loose ? 0.84 + Math.random() * 0.1 : 0.92 + Math.random() * 0.04);
    const jitter = (Math.random() - 0.5) * laneW * (loose ? 0.1 : 0.03);
    const x = lane * laneW + (laneW - w) / 2 + jitter;
    const r = loose ? (Math.random() - 0.5) * 9 : (Math.random() - 0.5) * 2.5;
    // altura estimada hasta medirla en pantalla
    const ratio = card.kind === "photo" && card.width && card.height ? card.width / card.height : 0.8;
    const h = card.kind === "photo" ? w * (0.05 + 0.9 / (ratio < 0.9 ? 0.8 : ratio > 1.15 ? 1.25 : 1) + 0.2) : w * 0.85;
    // mensajes como chat: alternan lado y color de avatar, sin inclinación
    const isNote = card.kind === "note";
    const side: "left" | "right" = isNote ? (noteCount.current++ % 2 === 0 ? "left" : "right") : "left";
    return { card, lane, t0, x, r: isNote ? 0 : r, w, h, fresh, side, tone: Math.floor(Math.random() * AVATAR_TONES.length) };
  };

  // Al recargar la pantalla: recuperar lo que estaba subiendo, en la altura que corresponde
  useEffect(() => {
    if (restored.current || !size.W || !cards.length) return;
    restored.current = true;
    const now = performance.now() / 1000;
    const wall0: Floating[] = [];
    const lanes = lanesFor(size.W, size.H);
    cards
      .filter((c) => c.playedAt && Date.now() - new Date(c.playedAt).getTime() < dwell * 1000)
      .forEach((c, i) => {
        used.current.add(c.id);
        const elapsed = (Date.now() - new Date(c.playedAt!).getTime()) / 1000;
        wall0.push(place(c, i % lanes, now - elapsed, false));
      });
    wallRef.current = wall0;
    setWall(wall0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.W, cards.length]);

  // Animación continua: posiciones, salidas por arriba y entradas por abajo
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const frame = (nowMs: number) => {
      const dt = Math.min(0.1, (nowMs - last) / 1000);
      last = nowMs;
      if (!pausedRef.current) clock.current += dt;
      const t = clock.current;
      const { W, H } = sizeRef.current;
      if (W && H) {
        const queue = cardsRef.current.filter((c) => !c.playedAt && !used.current.has(c.id));
        // sube despacio; si hay mucho por mostrar, acelera un poco para no atrasarse
        const travel = Math.max(35, dwell);
        const speed = (H / travel) * (1 + Math.min(1.5, queue.length / 15));
        let changed = false;
        const alive = cardsRef.current;

        for (const f of wallRef.current) {
          const el = els.current.get(f.card.id);
          if (!el) continue;
          if (el.dataset.measured !== "1" && el.offsetHeight) { f.h = el.offsetHeight; el.dataset.measured = "1"; }
          const y = H + 12 - speed * (t - f.t0);
          (f as Floating & { y?: number }).y = y;
          el.style.transform = `translate3d(${f.x}px, ${y}px, 0) rotate(${f.r}deg)`;
        }

        // salen las que pasaron por arriba o fueron retiradas desde el panel
        const kept = wallRef.current.filter((f) => {
          const y = (f as Floating & { y?: number }).y ?? H;
          return y > -f.h - 30 && alive.some((c) => c.id === f.card.id);
        });
        if (kept.length !== wallRef.current.length) { wallRef.current = kept; changed = true; }

        // entra una nueva por abajo en la columna con más espacio libre
        if (!pausedRef.current && queue.length) {
          const lanes = lanesFor(W, H);
          let best = -1, bestRoom = -Infinity;
          for (let l = 0; l < lanes; l++) {
            const inLane = wallRef.current.filter((f) => f.lane === l);
            const lowest = inLane.reduce((m, f) => Math.max(m, ((f as Floating & { y?: number }).y ?? H) + f.h), -Infinity);
            const room = inLane.length ? H - lowest : H; // espacio libre bajo la última de la columna
            if (room > bestRoom) { bestRoom = room; best = l; }
          }
          const gap = (W / lanes) * 0.1;
          // las columnas no arrancan juntas: la anterior debe ir subiendo antes de que entre otra
          const prev = lastSpawn.current;
          const staggered = !prev || speed * (t - prev.t0) >= prev.h * nextStagger.current;
          if (best >= 0 && bestRoom >= gap && staggered) {
            const card = queue[0];
            used.current.add(card.id);
            onPlayedRef.current([card]);
            const placed = place(card, best, t, true);
            lastSpawn.current = placed;
            nextStagger.current = 0.35 + Math.random() * 0.4;
            wallRef.current = [...wallRef.current, placed];
            changed = true;
          }
        }
        if (changed) setWall(wallRef.current);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dwell]);

  const empty = wall.length === 0;
  useEffect(() => onEmpty(empty), [empty, onEmpty]);

  return (
    <div ref={box} className="relative h-full w-full overflow-hidden [mask-image:linear-gradient(to_bottom,transparent_0,black_9%,black_93%,transparent_100%)]">
      {wall.map((f) => (
        <div
          key={f.card.id}
          ref={(el) => { if (el) els.current.set(f.card.id, el); else els.current.delete(f.card.id); }}
          className="absolute left-0 top-0 will-change-transform"
          style={{ width: f.w, transform: `translate3d(${f.x}px, ${size.H + 12}px, 0) rotate(${f.r}deg)` }}
        >
          {f.card.kind === "photo" ? <Polaroid card={f.card} fresh={f.fresh} /> : <ChatBubble card={f.card} side={f.side} tone={f.tone} />}
        </div>
      ))}
      <style>{`
        @keyframes develop{0%{filter:brightness(1.9) saturate(0) sepia(.35) blur(3px);opacity:.55}60%{filter:brightness(1.15) saturate(.7) sepia(.1) blur(0)}100%{filter:none;opacity:1}}
      `}</style>
    </div>
  );
}

/** Foto instantánea: marco crema, espacio inferior y mensaje manuscrito si lo hay. */
function Polaroid({ card, fresh }: { card: WallPhoto; fresh: boolean }) {
  const ratio = card.width && card.height ? card.width / card.height : 1;
  const aspect = ratio < 0.9 ? "4 / 5" : ratio > 1.15 ? "5 / 4" : "1 / 1";
  return (
    <figure className="bg-[#FBF8F2] p-[5%] pb-0 shadow-[0_1.4vmin_3.5vmin_rgba(0,0,0,0.45),0_0.2vmin_0.4vmin_rgba(0,0,0,0.25)] [container-type:inline-size]">
      <div className="relative overflow-hidden bg-[#1c1b19]" style={{ aspectRatio: aspect }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={card.url} alt="" className={`absolute inset-0 h-full w-full object-cover ${fresh ? "animate-[develop_5s_ease-out_both]" : ""}`} />
      </div>
      <figcaption className={`flex items-center justify-center px-[3%] text-center ${card.message ? "min-h-[22cqw] py-[4cqw]" : "h-[16cqw]"}`}>
        {card.message && (
          <p className={`font-hand leading-[1.05] text-[#2b2a27] ${card.message.length < 40 ? "text-[9cqw]" : card.message.length < 90 ? "text-[7cqw]" : "text-[5.6cqw]"} line-clamp-3`}>
            {card.message}
          </p>
        )}
      </figcaption>
    </figure>
  );
}

const AVATAR_TONES = ["#B79A70", "#9C8B7A", "#C9A99A", "#8FA08C", "#A7967F", "#B48F86"];

/** Mensaje sin foto como chat: avatar que alterna de lado y burbuja con hora y doble visto. */
function ChatBubble({ card, side, tone }: { card: WallNote; side: "left" | "right"; tone: number }) {
  const len = card.body.length;
  const left = side === "left";
  const time = card.at ? new Date(card.at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }) : "";
  return (
    <div className={`flex items-end gap-[3cqw] [container-type:inline-size] ${left ? "" : "flex-row-reverse"}`}>
      <span aria-hidden className="flex h-[15cqw] w-[15cqw] shrink-0 items-center justify-center rounded-full shadow-[0_0.6vmin_1.6vmin_rgba(0,0,0,0.35)]" style={{ background: AVATAR_TONES[tone % AVATAR_TONES.length] }}>
        <svg viewBox="0 0 24 24" className="h-[9cqw] w-[9cqw]" fill="#FFFEFC" opacity=".92"><circle cx="12" cy="8.5" r="4.2" /><path d="M3.8 21c.9-4.4 4.2-6.8 8.2-6.8s7.3 2.4 8.2 6.8z" /></svg>
      </span>
      <div
        className={`relative max-w-[80cqw] px-[5.5cqw] pb-[3.2cqw] pt-[4.2cqw] shadow-[0_1vmin_2.8vmin_rgba(0,0,0,0.38)] ${left ? "rounded-[6cqw] rounded-bl-[1.2cqw] bg-[#FFFEFC]" : "rounded-[6cqw] rounded-br-[1.2cqw] bg-[#EFE4D2]"}`}
      >
        <p className={`text-[#242321] leading-[1.28] ${len < 40 ? "text-[8.2cqw]" : len < 110 ? "text-[6.6cqw]" : "text-[5.4cqw]"}`}>{card.body}</p>
        <span className="mt-[1.6cqw] flex items-center justify-end gap-[1cqw] text-[3.8cqw] text-[#8C8780]">
          {time}
          <svg viewBox="0 0 18 12" className="h-[3.6cqw] w-[5.4cqw]" fill="none" stroke="#B79A70" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 6.5l3.2 3.2L11 2.5M7 9.7l.4.4L15.5 2.5" /></svg>
        </span>
      </div>
    </div>
  );
}
