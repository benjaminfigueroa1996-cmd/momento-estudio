"use client";

import { useEffect, useRef, useState } from "react";

export type PhotoCard = { kind: "photo"; id: string; url: string; width: number | null; height: number | null; message: string | null; at: string };
export type NoteCard = { kind: "note"; id: string; body: string; at: string };
export type Card = PhotoCard | NoteCard;
export type Orient = "landscape" | "portrait" | "square" | "ultrawide";
type Cell = "p" | "m" | "n"; // foto, mensaje de la foto anterior, mensaje sin foto
type Template = { cols: string; rows: string; areas: string; cells: Cell[] };

/** Detecta la proporción real de la pantalla y se actualiza si cambia. */
export function useOrientation(): Orient {
  const [o, setO] = useState<Orient>("landscape");
  useEffect(() => {
    const calc = () => {
      const r = window.innerWidth / window.innerHeight;
      setO(r >= 2.1 ? "ultrawide" : r >= 1.25 ? "landscape" : r <= 0.8 ? "portrait" : "square");
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return o;
}

// Composiciones posibles por formato. No son plantillas fijas: se eligen según el contenido disponible.
const T: Record<Orient, Record<string, Template>> = {
  landscape: {
    solo: { cols: "1fr", rows: "1fr", areas: '"a"', cells: ["p"] },
    "photo+msg": { cols: "1.45fr 1fr", rows: "1fr", areas: '"a b"', cells: ["p", "m"] },
    duo: { cols: "1fr 1fr", rows: "1fr", areas: '"a b"', cells: ["p", "p"] },
    trio: { cols: "1.55fr 1fr", rows: "1fr 1fr", areas: '"a b" "a c"', cells: ["p", "p", "p"] },
    note: { cols: "1fr", rows: "1fr", areas: '"a"', cells: ["n"] },
    "note+photo": { cols: "1fr 1.25fr", rows: "1fr", areas: '"a b"', cells: ["n", "p"] },
    "duo+note": { cols: "1fr 1fr 0.85fr", rows: "1fr", areas: '"a b c"', cells: ["p", "p", "n"] },
  },
  portrait: {
    solo: { cols: "1fr", rows: "1fr", areas: '"a"', cells: ["p"] },
    "photo+msg": { cols: "1fr", rows: "1.8fr 1fr", areas: '"a" "b"', cells: ["p", "m"] },
    duo: { cols: "1fr", rows: "1fr 1fr", areas: '"a" "b"', cells: ["p", "p"] },
    trio: { cols: "1fr 1fr", rows: "1.4fr 1fr", areas: '"a a" "b c"', cells: ["p", "p", "p"] },
    note: { cols: "1fr", rows: "1fr", areas: '"a"', cells: ["n"] },
    "note+photo": { cols: "1fr", rows: "1.5fr 1fr", areas: '"a" "b"', cells: ["p", "n"] },
    "duo+note": { cols: "1fr", rows: "1.15fr 0.7fr 1.15fr", areas: '"a" "b" "c"', cells: ["p", "n", "p"] },
  },
  square: {
    solo: { cols: "1fr", rows: "1fr", areas: '"a"', cells: ["p"] },
    "photo+msg": { cols: "1.25fr 1fr", rows: "1fr", areas: '"a b"', cells: ["p", "m"] },
    duo: { cols: "1fr 1fr", rows: "1fr", areas: '"a b"', cells: ["p", "p"] },
    quad: { cols: "1fr 1fr", rows: "1fr 1fr", areas: '"a b" "c d"', cells: ["p", "p", "p", "p"] },
    note: { cols: "1fr", rows: "1fr", areas: '"a"', cells: ["n"] },
    "note+photo": { cols: "1fr 1fr", rows: "1fr", areas: '"a b"', cells: ["n", "p"] },
    "duo+note": { cols: "1fr 1fr", rows: "1.3fr 1fr", areas: '"a b" "c c"', cells: ["p", "p", "n"] },
  },
  ultrawide: {
    "photo+msg": { cols: "1.3fr 1fr", rows: "1fr", areas: '"a b"', cells: ["p", "m"] },
    duo: { cols: "1fr 1fr", rows: "1fr", areas: '"a b"', cells: ["p", "p"] },
    trio: { cols: "1fr 1fr 1fr", rows: "1fr", areas: '"a b c"', cells: ["p", "p", "p"] },
    "main+2": { cols: "1.7fr 1fr 1fr", rows: "1fr", areas: '"a b c"', cells: ["p", "p", "p"] },
    quad: { cols: "1fr 1fr 1fr 1fr", rows: "1fr", areas: '"a b c d"', cells: ["p", "p", "p", "p"] },
    note: { cols: "1fr", rows: "1fr", areas: '"a"', cells: ["n"] },
    "note+photo": { cols: "1fr 1.3fr", rows: "1fr", areas: '"a b"', cells: ["n", "p"] },
    "duo+note": { cols: "1fr 1fr 0.9fr", rows: "1fr", areas: '"a b c"', cells: ["p", "p", "n"] },
  },
};

export type Scene = { key: string; template: Template; cards: Card[]; seconds: number };

/**
 * Elige la próxima escena: lo nuevo primero y, si no hay nada nuevo, lo que hace más tiempo no se ve.
 * `force` permite al panel fijar un estilo (una foto, foto con mensaje o mosaico).
 */
export function useScenes(cards: Card[], orient: Orient, baseSeconds: number, paused: boolean, force: string | null) {
  const shownAt = useRef(new Map<string, number>());
  const lastTemplate = useRef("");
  const [scene, setScene] = useState<Scene | null>(null);
  const cardsRef = useRef(cards);
  cardsRef.current = cards;

  const pick = (): Scene | null => {
    const all = cardsRef.current;
    if (!all.length) return null;
    const order = [...all].sort((a, b) => {
      const sa = shownAt.current.get(a.id) ?? -1, sb = shownAt.current.get(b.id) ?? -1;
      return sa === sb ? a.at.localeCompare(b.at) : sa - sb;
    });
    const photos = order.filter((c): c is PhotoCard => c.kind === "photo");
    const notes = order.filter((c): c is NoteCard => c.kind === "note");
    const set = T[orient];
    const first = order[0];

    const options: string[] = [];
    if (force === "full" && photos.length) options.push(set.solo ? "solo" : "photo+msg");
    else if (force === "message" && photos.length) options.push("photo+msg");
    else if (force === "mosaic" && photos.length) options.push(set.quad && photos.length >= 4 ? "quad" : set.trio && photos.length >= 3 ? "trio" : "duo");
    else if (first.kind === "note") {
      options.push("note");
      if (photos.length) options.push("note+photo", "note+photo");
      if (photos.length >= 2) options.push("duo+note");
    } else {
      const p = first as PhotoCard;
      if (p.message) options.push("photo+msg", "photo+msg", "photo+msg");
      else if (set.solo) options.push("solo");
      if (photos.length >= 2) options.push("duo");
      if (photos.length >= 3) options.push(set.trio ? "trio" : "main+2", ...(set["main+2"] ? ["main+2"] : []));
      if (photos.length >= 4 && set.quad) options.push("quad");
      if (photos.length >= 2 && notes.length) options.push("duo+note");
    }
    const valid = options.filter((o) => set[o]);
    if (!valid.length) valid.push(set.solo ? "solo" : "photo+msg");
    const fresh = valid.filter((o) => o !== lastTemplate.current);
    const name = (fresh.length ? fresh : valid)[Math.floor(Math.random() * (fresh.length || valid.length))];
    lastTemplate.current = name;
    const template = set[name];

    // Asignar contenido a cada celda
    const usedPhotos = [...photos], usedNotes = [...notes];
    const chosen: Card[] = [];
    let previous: PhotoCard | null = null;
    for (const cell of template.cells) {
      if (cell === "p") {
        // en "foto con mensaje" se prefiere una foto que tenga mensaje
        const idx = name === "photo+msg" ? Math.max(0, usedPhotos.findIndex((x) => x.message)) : 0;
        const p = usedPhotos.splice(idx, 1)[0];
        if (p) { chosen.push(p); previous = p; }
      } else if (cell === "m") {
        if (previous?.message) chosen.push({ kind: "note", id: `${previous.id}-m`, body: previous.message, at: previous.at });
        else chosen.push({ kind: "note", id: "tagline", body: "", at: "" });
      } else {
        const n = usedNotes.shift();
        if (n) chosen.push(n);
      }
    }
    const now = Date.now();
    chosen.forEach((c) => shownAt.current.set(c.id, now));
    const nPhotos = chosen.filter((c) => c.kind === "photo").length;
    return { key: `${name}-${now}`, template, cards: chosen, seconds: baseSeconds * (1 + 0.4 * Math.max(0, nPhotos - 1)) };
  };

  // Primera escena y reacción a cambios de formato o de estilo forzado
  useEffect(() => {
    setScene(pick());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orient, force, cards.length === 0]);

  useEffect(() => {
    if (paused || !scene) return;
    const t = setTimeout(() => setScene(pick()), scene.seconds * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, paused]);

  // Si una foto de la escena fue retirada, se cambia de escena de inmediato
  useEffect(() => {
    if (scene && scene.cards.some((c) => !c.id.endsWith("-m") && c.id !== "tagline" && !cards.some((x) => x.id === c.id))) setScene(pick());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  return scene;
}

/** Foto que se ajusta: llena la celda si las proporciones se parecen; si no, se muestra entera sobre un fondo difuminado. */
export function PhotoCell({ card, caption, delay }: { card: PhotoCard; caption: boolean; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<"cover" | "contain">("cover");
  useEffect(() => {
    const el = ref.current;
    if (!el || !card.width || !card.height) return;
    const ro = new ResizeObserver(([e]) => {
      const cell = e.contentRect.width / Math.max(1, e.contentRect.height);
      const photo = card.width! / card.height!;
      setFit(Math.max(cell, photo) / Math.min(cell, photo) > 1.45 ? "contain" : "cover");
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [card.width, card.height]);

  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden rounded-[1.2vmin] bg-black/30 animate-[cell_1000ms_cubic-bezier(0.22,1,0.36,1)_both]" style={{ animationDelay: `${delay}ms` }}>
      {fit === "contain" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.url} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={card.url} alt="" className={`relative h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"} animate-[drift_14s_ease-out_forwards]`} />
      {caption && card.message && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-[2.4vmin] pb-[2vmin] pt-[8vmin]">
          <p className="line-clamp-3 font-serif text-[2.6vmin] leading-snug text-blanco">“{card.message}”</p>
        </div>
      )}
    </div>
  );
}

/** Mensaje como protagonista: tamaño de letra según el largo del texto. */
export function MessageCell({ body, tone, delay, fallback }: { body: string; tone: "light" | "warm"; delay: number; fallback: string }) {
  const text = body || fallback;
  const size = text.length < 50 ? "text-[5.2vmin]" : text.length < 120 ? "text-[4vmin]" : "text-[3.1vmin]";
  return (
    <div
      className={`flex h-full w-full flex-col justify-center rounded-[1.2vmin] px-[5vmin] py-[4vmin] animate-[cell_1000ms_cubic-bezier(0.22,1,0.36,1)_both] ${tone === "warm" ? "bg-beige" : "bg-marfil"}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span aria-hidden className="font-serif text-[9vmin] leading-[0.6] text-champagne">“</span>
      <p className={`mt-[1.5vmin] font-serif leading-[1.18] text-carbon ${size}`}>{text}</p>
    </div>
  );
}
