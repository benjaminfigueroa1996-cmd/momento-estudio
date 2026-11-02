"use client";

import { useEffect, useRef, useState } from "react";
import type { Orient } from "./Composer";

export type WallPhoto = { kind: "photo"; id: string; url: string; width: number | null; height: number | null; message: string | null; at: string; playedAt: string | null };
export type WallNote = { kind: "note"; id: string; body: string; at: string; playedAt: string | null };
export type WallCard = WallPhoto | WallNote;

type Slot = { x: number; y: number; w: number; r: number }; // % del escenario, ancho en %, rotación en grados
type Placed = { card: WallCard; slot: number; enteredAt: number; z: number; leaving: boolean; leftAt: number; fresh: boolean };

// Posiciones del collage: dos filas en pantallas anchas, tres en verticales. Asimétricas pero equilibradas.
const SLOTS: Record<"landscape" | "portrait" | "square", Slot[]> = {
  landscape: [
    { x: 1.5, y: 3, w: 21, r: -4 }, { x: 22.5, y: 1, w: 16, r: 3 }, { x: 38.5, y: 5, w: 23, r: -2 }, { x: 62, y: 1.5, w: 17, r: 4 },
    { x: 80, y: 6, w: 18, r: -3 },
    { x: 4, y: 50, w: 17, r: 3 }, { x: 21, y: 46, w: 22, r: -3 }, { x: 44, y: 51, w: 16, r: 2 }, { x: 60, y: 45, w: 21, r: -4 },
    { x: 81, y: 52, w: 16, r: 3 },
  ],
  portrait: [
    { x: 3, y: 1, w: 46, r: -3 }, { x: 51, y: 4, w: 44, r: 3 },
    { x: 6, y: 34, w: 42, r: 2 }, { x: 50, y: 36, w: 46, r: -3 },
    { x: 2, y: 67, w: 45, r: -2 }, { x: 51, y: 69, w: 42, r: 4 },
  ],
  square: [
    { x: 2, y: 3, w: 31, r: -3 }, { x: 34, y: 1, w: 30, r: 2 }, { x: 66, y: 5, w: 31, r: -2 },
    { x: 4, y: 51, w: 30, r: 3 }, { x: 35, y: 48, w: 31, r: -3 }, { x: 67, y: 52, w: 30, r: 2 },
  ],
};

/**
 * Muro de recuerdos instantáneos. Cada foto o mensaje entra UNA vez, con efecto de revelado,
 * permanece un tiempo y sale. Lo proyectado se informa al servidor y nunca se repite.
 */
export default function PolaroidWall({
  cards, orient, step, dwell, paused, onPlayed, onEmpty,
}: {
  cards: WallCard[]; orient: Orient; step: number; dwell: number; paused: boolean;
  onPlayed: (c: WallCard[]) => void; onEmpty: (empty: boolean) => void;
}) {
  const kind = orient === "portrait" ? "portrait" : orient === "square" ? "square" : "landscape";
  const slots = SLOTS[kind];
  const [wall, setWall] = useState<Placed[]>([]);
  const used = useRef(new Set<string>()); // nunca se vuelve a mostrar lo que ya entró
  const z = useRef(1);
  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const restored = useRef(false);

  // Al abrir la pantalla: reconstruir lo que estaba en el muro (proyectado hace poco), sin volver a "revelarlo"
  useEffect(() => {
    if (restored.current || !cards.length) return;
    restored.current = true;
    const now = Date.now();
    const recent = cards
      .filter((c) => c.playedAt && now - new Date(c.playedAt).getTime() < dwell * 1000)
      .slice(-slots.length);
    recent.forEach((c) => used.current.add(c.id));
    setWall(recent.map((c, i) => ({ card: c, slot: i, enteredAt: new Date(c.playedAt!).getTime(), z: z.current++, leaving: false, leftAt: 0, fresh: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length]);

  useEffect(() => {
    if (paused) return;
    const tick = () => {
      const now = Date.now();
      setWall((prev) => {
        let next = prev.filter((p) => !(p.leaving && now - p.leftAt > 1300));
        // vencidas o retiradas desde el panel: salen con animación
        next = next.map((p) => (!p.leaving && (now - p.enteredAt > dwell * 1000 || !cardsRef.current.some((c) => c.id === p.card.id)) ? { ...p, leaving: true, leftAt: now } : p));

        const queue = cardsRef.current.filter((c) => !c.playedAt && !used.current.has(c.id));
        const incoming = queue[0];
        if (incoming) {
          const active = next.filter((p) => !p.leaving);
          const taken = new Set(active.map((p) => p.slot));
          const free = slots.map((_, i) => i).filter((i) => !taken.has(i));
          let slot: number;
          if (free.length) slot = free[Math.floor(Math.random() * free.length)];
          else {
            const oldest = active.reduce((a, b) => (a.enteredAt < b.enteredAt ? a : b));
            slot = oldest.slot;
            next = next.map((p) => (p === oldest ? { ...p, leaving: true, leftAt: now } : p));
          }
          used.current.add(incoming.id);
          onPlayed([incoming]);
          next = [...next, { card: incoming, slot, enteredAt: now, z: z.current++, leaving: false, leftAt: 0, fresh: true }];
        }
        return next;
      });
    };
    tick();
    const t = setInterval(tick, step * 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, step, dwell, kind]);

  // Limpieza de las que terminaron de salir y salida de las vencidas aunque no llegue nada nuevo
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      setWall((prev) => {
        const next = prev
          .filter((p) => !(p.leaving && now - p.leftAt > 1300))
          .map((p) => (!p.leaving && (now - p.enteredAt > dwell * 1000 || !cardsRef.current.some((c) => c.id === p.card.id)) ? { ...p, leaving: true, leftAt: now } : p));
        return next.length === prev.length && next.every((p, i) => p === prev[i]) ? prev : next;
      });
    }, 1500);
    return () => clearInterval(t);
  }, [dwell]);

  const empty = wall.filter((p) => !p.leaving).length === 0;
  useEffect(() => onEmpty(empty), [empty, onEmpty]);

  return (
    <div className="relative h-full w-full">
      {wall.map((p) => {
        const s = slots[p.slot % slots.length];
        return (
          <div
            key={p.card.id}
            className={`absolute transition-[opacity,transform] duration-[1100ms] ease-suave ${p.leaving ? "opacity-0 translate-y-[3vmin]" : "opacity-100"}`}
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, zIndex: p.z }}
          >
            <div className={p.fresh ? "animate-[drop_1100ms_cubic-bezier(0.22,1,0.36,1)_both]" : ""} style={{ transform: `rotate(${s.r}deg)` }}>
              {p.card.kind === "photo" ? <Polaroid card={p.card} fresh={p.fresh} /> : <NoteCard card={p.card} />}
            </div>
          </div>
        );
      })}
      <style>{`
        @keyframes drop{from{opacity:0;transform:translateY(-6vmin) scale(1.08) rotate(0deg)}to{opacity:1}}
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
        <img src={card.url} alt="" className={`absolute inset-0 h-full w-full object-cover ${fresh ? "animate-[develop_4.5s_ease-out_both]" : ""}`} />
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

/** Tarjeta de mensaje sin foto, con una cinta de papel arriba. */
function NoteCard({ card }: { card: WallNote }) {
  const len = card.body.length;
  return (
    <div className="relative mx-[6%] [container-type:inline-size]">
      <span aria-hidden className="absolute -top-[4cqw] left-1/2 h-[9cqw] w-[38cqw] -translate-x-1/2 rotate-[-3deg] bg-[#E8DFD3]/80 shadow-sm" />
      <div className="flex min-h-[70cqw] items-center justify-center bg-[#F4ECDF] px-[9cqw] py-[11cqw] text-center shadow-[0_1.4vmin_3.5vmin_rgba(0,0,0,0.4)]">
        <p className={`font-hand leading-[1.08] text-[#2b2a27] ${len < 40 ? "text-[13cqw]" : len < 100 ? "text-[10cqw]" : "text-[8cqw]"}`}>{card.body}</p>
      </div>
    </div>
  );
}
