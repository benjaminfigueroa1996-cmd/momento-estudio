"use client";

import { useEffect, useRef, useState } from "react";

type Item = { id: string; url: string; width: number | null; height: number | null; message: string | null };
type Entry = { key: string; side: "left" | "right"; item: Item };

/**
 * Pantalla estilo conversación: cada foto llega como un mensaje, alternando izquierda y derecha.
 * Las fotos nuevas tienen prioridad; cuando no hay nuevas, se repasan las que siguen vigentes.
 */
export default function ChatFeed({ items, seconds, paused, eventName }: { items: Item[]; seconds: number; paused: boolean; eventName: string }) {
  const [feed, setFeed] = useState<Entry[]>([]);
  const seen = useRef(new Set<string>());
  const cursor = useRef(0);
  const count = useRef(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const next = () => {
    const list = itemsRef.current;
    if (!list.length) return;
    const fresh = list.find((i) => !seen.current.has(i.id));
    let it: Item;
    if (fresh) {
      it = fresh;
      seen.current.add(fresh.id);
    } else {
      it = list[cursor.current % list.length];
      cursor.current += 1;
    }
    const side: Entry["side"] = count.current % 2 === 0 ? "left" : "right";
    count.current += 1;
    setFeed((f) => [...f.slice(-2), { key: `${it.id}-${count.current}`, side, item: it }]);
  };

  // Primera foto apenas hay contenido
  useEffect(() => {
    if (!feed.length && items.length) next();
    // Quitar del chat lo que ya salió de la rotación o fue retirado
    setFeed((f) => f.filter((e) => items.some((i) => i.id === e.item.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, seconds * 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, seconds]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-carbon">
      {/* luz cálida muy suave en el fondo */}
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(183,154,112,0.18),transparent_60%)]" />

      <header className="absolute left-[4vw] top-[4.5vh] z-10">
        <p className="text-[0.95vw] uppercase tracking-[0.3em] text-champagne">Momento Estudio</p>
        <h1 className="mt-[0.8vh] font-serif text-[2.6vw] leading-none text-marfil">{eventName}</h1>
      </header>

      <div
        className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-end gap-[2.4vh] px-[6vw] pb-[6vh] pt-[14vh] [mask-image:linear-gradient(to_bottom,transparent_0,black_22vh)]"
      >
        {feed.map((e, i) => (
          <Bubble key={e.key} entry={e} newest={i === feed.length - 1} />
        ))}
      </div>
    </div>
  );
}

function Bubble({ entry, newest }: { entry: Entry; newest: boolean }) {
  const left = entry.side === "left";
  const { item } = entry;
  const vertical = (item.height ?? 1) > (item.width ?? 1);
  return (
    <div className={`flex ${left ? "justify-start" : "justify-end"} animate-[bubble_900ms_cubic-bezier(0.22,1,0.36,1)]`}>
      <figure
        className={`relative max-w-[52vw] rounded-[1.4vw] p-[0.55vw] shadow-[0_2vh_6vh_rgba(0,0,0,0.35)] transition-all duration-700 ease-suave ${
          left ? "rounded-bl-[0.3vw] bg-blanco" : "rounded-br-[0.3vw] bg-beige"
        } ${newest ? "opacity-100" : "opacity-55"}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt=""
          className={`block rounded-[1vw] object-cover transition-all duration-700 ease-suave ${
            newest ? (vertical ? "h-[52vh] w-auto" : "h-[46vh] w-auto") : "h-[16vh] w-auto"
          }`}
        />
        <figcaption className={`flex items-end gap-[1vw] px-[0.6vw] ${newest ? "pb-[0.6vh] pt-[1.4vh]" : "pb-[0.2vh] pt-[0.8vh]"}`}>
          {item.message ? (
            <p className={`flex-1 font-serif leading-snug text-carbon ${newest ? "text-[2vw]" : "text-[1.1vw]"}`}>{item.message}</p>
          ) : (
            <p className={`flex-1 text-piedra ${newest ? "text-[1vw]" : "text-[0.8vw]"}`}>Foto compartida</p>
          )}
          <span className="flex shrink-0 items-center gap-[0.3vw] pb-[0.3vh] text-[0.8vw] text-champagne" aria-hidden>
            <svg viewBox="0 0 16 16" className="h-[0.9vw] w-[0.9vw]" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 8.5l3 3L14 3" /></svg>
            <svg viewBox="0 0 16 16" className="-ml-[0.5vw] h-[0.9vw] w-[0.9vw]" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 8.5l3 3L14 3" /></svg>
          </span>
        </figcaption>
      </figure>
    </div>
  );
}
