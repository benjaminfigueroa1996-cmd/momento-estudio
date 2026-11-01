"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Photo = { id: string; thumb: string; display: string; professional: boolean; width: number | null; height: number | null };

export default function Album({ slug, name, hosts, available }: { slug: string; name: string; hosts: string; available: boolean }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [next, setNext] = useState<string | null | undefined>(undefined);
  const [downloads, setDownloads] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (loading || next === null) return;
    setLoading(true);
    const r = await fetch(`/api/e/${slug}/album${next ? `?before=${encodeURIComponent(next)}` : ""}`);
    if (r.ok) {
      const j = await r.json();
      setPhotos((p) => [...p, ...j.items]);
      setNext(j.next);
      setDownloads(j.downloads);
    } else setNext(null);
    setLoading(false);
  }, [slug, next, loading]);

  useEffect(() => {
    if (!available) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && load(), { rootMargin: "800px" });
    if (sentinel.current) io.observe(sentinel.current);
    return () => io.disconnect();
  }, [load, available]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (open === null) return;
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => Math.min((i ?? 0) + 1, photos.length - 1));
      if (e.key === "ArrowLeft") setOpen((i) => Math.max((i ?? 0) - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, photos.length]);

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-end justify-between gap-6 px-5 pb-8 pt-[max(2.5rem,env(safe-area-inset-top))] md:px-8">
        <div>
          <p className="text-[13px] text-piedra">Álbum compartido</p>
          <h1 className="mt-2 text-[40px] leading-[1.05] md:text-[56px]">{name}</h1>
          <p className="mt-2 text-[15px] text-carbon/70">{hosts}</p>
        </div>
        <Link href={`/e/${slug}`} className="btn-quiet hidden shrink-0 md:inline-flex">Compartir una foto</Link>
      </header>

      {!available ? (
        <p className="mx-auto max-w-6xl px-5 text-[17px] md:px-8">El álbum de este evento no está disponible.</p>
      ) : (
        <section className="mx-auto max-w-6xl px-1.5 md:px-8">
          <div className="grid grid-cols-3 gap-1.5 md:grid-cols-4 md:gap-2 lg:grid-cols-5">
            {photos.map((p, i) => (
              <button key={p.id} onClick={() => setOpen(i)} className="group relative aspect-square overflow-hidden bg-beige md:rounded-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumb} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 ease-suave group-hover:scale-[1.03]" />
              </button>
            ))}
          </div>
          <div ref={sentinel} className="h-20" />
          {next === null && photos.length === 0 && (
            <div className="px-4 pb-24 pt-6 text-center">
              <p className="text-[17px]">Todavía no hay fotos en el álbum.</p>
              <Link className="btn-primary mt-6" href={`/e/${slug}`}>Comparte la primera</Link>
            </div>
          )}
        </section>
      )}

      <Link href={`/e/${slug}`} className="btn-primary fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 shadow-lg md:hidden">Compartir una foto</Link>

      {open !== null && photos[open] && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex flex-col bg-carbon/95 text-blanco">
          <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <button onClick={() => setOpen(null)} className="px-2 py-2 text-[15px]">Cerrar</button>
            <span className="text-[13px] text-blanco/60">{photos[open].professional ? "Fotógrafo oficial" : ""}</span>
            {downloads ? (
              <a href={`/api/e/${slug}/download/${photos[open].id}`} className="px-2 py-2 text-[15px]">Descargar</a>
            ) : <span className="w-20" />}
          </div>
          <div className="relative flex flex-1 items-center justify-center p-3"
            onTouchStart={(e) => ((e.currentTarget as HTMLElement).dataset.x = String(e.touches[0].clientX))}
            onTouchEnd={(e) => {
              const dx = e.changedTouches[0].clientX - Number((e.currentTarget as HTMLElement).dataset.x);
              if (dx < -50) setOpen(Math.min(open + 1, photos.length - 1));
              if (dx > 50) setOpen(Math.max(open - 1, 0));
            }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[open].display} alt="" className="max-h-full max-w-full object-contain" />
          </div>
        </div>
      )}
    </main>
  );
}
