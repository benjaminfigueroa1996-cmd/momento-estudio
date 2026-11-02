"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import DestinationCard, { ScreenIcon, AlbumIcon } from "./DestinationCard";
import { prepare, put, postJSON, type Prepared } from "@/lib/client/image";

type Dest = "screen" | "album";
type Item = { prep: Prepared; dest: Dest[]; message: string; progress: number; state: "lista" | "subiendo" | "enviada" | "error"; error?: string };
type Ticket = { mediaId: string; original: string; display: string; thumb: string };

export default function GuestFlow(props: {
  slug: string; cover: string | null; name: string; hosts: string; open: boolean; albumOpen: boolean; moderatedScreen: boolean; maxFiles: number;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [current, setCurrent] = useState(0);
  const [step, setStep] = useState<"inicio" | "destinos" | "revisar" | "enviando" | "listo" | "nota" | "nota-lista">("inicio");
  const [note, setNote] = useState("");
  const [notePending, setNotePending] = useState(false);
  const [sendingNote, setSendingNote] = useState(false);

  async function sendNote() {
    setSendingNote(true);
    setError(null);
    try {
      const r = await postJSON<{ pending: boolean }>(`/api/e/${props.slug}/mensaje`, { body: note });
      setNotePending(r.pending);
      setNote("");
      setStep("nota-lista");
    } catch (e) {
      setError((e as Error).message);
    }
    setSendingNote(false);
  }
  const [error, setError] = useState<string | null>(null);
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    const files = Array.from(list).slice(0, props.maxFiles - items.length);
    const prepared = await Promise.all(files.map(prepare));
    setItems((prev) => [...prev, ...prepared.map((prep) => ({ prep, dest: [] as Dest[], message: "", progress: 0, state: "lista" as const }))]);
    setStep("destinos");
  }

  const update = (i: number, patch: Partial<Item>) => setItems((prev) => prev.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const toggle = (i: number, d: Dest) => {
    const has = items[i].dest.includes(d);
    update(i, { dest: has ? items[i].dest.filter((x) => x !== d) : [...items[i].dest, d] });
  };
  const applyToAll = () => setItems((prev) => prev.map((it) => ({ ...it, dest: [...items[current].dest] })));
  const remove = (i: number) => {
    setItems((prev) => prev.filter((_, j) => j !== i));
    setCurrent(0);
    if (items.length === 1) setStep("inicio");
  };

  const ready = items.length > 0 && items.every((it) => it.dest.length > 0);

  async function send() {
    setStep("enviando");
    setError(null);
    try {
      const pending = items.map((it, i) => ({ it, i })).filter(({ it }) => it.state !== "enviada");
      const { tickets } = await postJSON<{ tickets: Ticket[] }>(`/api/e/${props.slug}/uploads`, {
        files: pending.map(({ it }) => ({ type: it.prep.type, size: it.prep.file.size, name: it.prep.file.name })),
      });
      // De a dos fotos a la vez: rápido sin saturar el wifi del salón
      const queue = pending.map((p, k) => ({ ...p, t: tickets[k] }));
      const worker = async () => {
        for (let next = queue.shift(); next; next = queue.shift()) {
          const { it, i, t } = next;
          update(i, { state: "subiendo" });
          try {
            await put(t.original, it.prep.file, it.prep.type, (p) => update(i, { progress: p * 0.85 }));
            if (it.prep.display) await put(t.display, it.prep.display, "image/jpeg");
            if (it.prep.thumb) await put(t.thumb, it.prep.thumb, "image/jpeg");
            await postJSON(`/api/e/${props.slug}/complete`, {
              mediaId: t.mediaId,
              destinations: it.dest,
              message: it.dest.includes("screen") && it.message.trim() ? it.message.trim() : undefined,
              width: it.prep.width,
              height: it.prep.height,
            });
            update(i, { state: "enviada", progress: 1 });
          } catch (e) {
            update(i, { state: "error", error: (e as Error).message });
          }
        }
      };
      await Promise.all([worker(), worker()]);
      setStep("listo");
    } catch (e) {
      setError((e as Error).message);
      setStep("revisar");
    }
  }

  const header = (
    <>
    {props.cover && step === "inicio" && (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={props.cover} alt="" className="h-[34vh] w-full object-cover" />
    )}
    <header className={`px-6 ${props.cover && step === "inicio" ? "pt-8" : "pt-[max(2.5rem,env(safe-area-inset-top))]"}`}>
      <p className="text-[13px] text-piedra">Momento Estudio</p>
      <h1 className="mt-2 text-[40px] leading-[1.05]">{props.name}</h1>
      <p className="mt-2 text-[15px] text-carbon/70">{props.hosts}</p>
    </header>
    </>
  );

  if (!props.open) {
    return (
      <main className="mx-auto min-h-dvh max-w-md">
        {header}
        <section className="px-6 pt-10">
          <p className="text-[17px]">La recepción de fotos de este evento ya cerró.</p>
          {props.albumOpen && <Link className="btn-primary mt-8 w-full" href={`/e/${props.slug}/album`}>Ver el álbum</Link>}
        </section>
      </main>
    );
  }

  const it = items[current];
  const sent = items.filter((x) => x.state === "enviada").length;
  const failed = items.filter((x) => x.state === "error").length;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {header}

      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFiles(e.target.files)} />
      <input ref={gallery} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />

      {step === "inicio" && (
        <section className="flex flex-1 flex-col px-6 pt-10">
          <p className="text-[19px] leading-snug">Comparte tus fotos y mensajes de este día. Puedes enviarlos a la pantalla del evento, al álbum compartido o a ambos.</p>
          <div className="mt-auto space-y-3 pt-10">
            <button className="btn-primary w-full" onClick={() => camera.current?.click()}>Tomar una foto</button>
            <button className="btn-quiet w-full" onClick={() => gallery.current?.click()}>Elegir de mi galería</button>
            <button className="btn-quiet w-full" onClick={() => { setError(null); setStep("nota"); }}>Escribir solo un mensaje</button>
            {props.albumOpen && <Link className="block py-3 text-center text-[15px] text-carbon/70 underline-offset-4 hover:underline" href={`/e/${props.slug}/album`}>Ver el álbum</Link>}
          </div>
          <p className="mt-6 text-[12px] leading-relaxed text-piedra">
            Tus fotos las reciben los anfitriones de este evento. No necesitas crear una cuenta. <Link href="/privacidad" className="underline">Privacidad</Link>
          </p>
        </section>
      )}

      {step === "nota" && (
        <section className="flex flex-1 flex-col px-6 pt-8">
          <h2 className="text-[26px]">Un mensaje para la pantalla</h2>
          <p className="mt-2 text-[15px] text-carbon/70">Aparecerá en la pantalla del evento y quedará guardado para los anfitriones.</p>
          <textarea className="field mt-6 min-h-[140px] resize-none text-[18px]" maxLength={280} autoFocus
            placeholder="¡Que viva el amor!" value={note} onChange={(e) => setNote(e.target.value)} />
          <p className="mt-1 text-right text-[12px] text-piedra">{note.length}/280</p>
          {error && <p className="mt-2 text-[14px] text-[#8a3b2e]" role="alert">{error}</p>}
          <div className="mt-auto space-y-3 pt-8">
            <button className="btn-primary w-full" disabled={!note.trim() || sendingNote} onClick={sendNote}>{sendingNote ? "Enviando…" : "Enviar mensaje"}</button>
            <button className="btn-quiet w-full" onClick={() => setStep("inicio")}>Volver</button>
          </div>
        </section>
      )}

      {step === "nota-lista" && (
        <section className="flex flex-1 flex-col px-6 pt-12">
          <svg width="44" height="44" viewBox="0 0 44 44" className="text-champagne" aria-hidden><circle cx="22" cy="22" r="21" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M14 22.5l5.5 5.5L30.5 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <h2 className="mt-6 text-[32px] leading-tight">Recibimos tu mensaje</h2>
          <p className="mt-3 text-[16px] text-carbon/75">{notePending ? "Aparecerá en la pantalla cuando los anfitriones lo aprueben." : "Míralo en la pantalla del evento."}</p>
          <div className="mt-auto space-y-3 pt-10">
            <button className="btn-primary w-full" onClick={() => setStep("nota")}>Escribir otro mensaje</button>
            <button className="btn-quiet w-full" onClick={() => setStep("inicio")}>Compartir una foto</button>
          </div>
        </section>
      )}

      {step === "destinos" && it && (
        <section className="flex flex-1 flex-col px-6 pt-8">
          <div className="relative overflow-hidden rounded-2xl bg-beige">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.prep.preview} alt="Vista previa" className="max-h-[42vh] w-full object-contain" />
            <button onClick={() => remove(current)} className="absolute right-3 top-3 rounded-full bg-carbon/70 px-3 py-1.5 text-[13px] text-blanco backdrop-blur">Quitar</button>
          </div>

          {items.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Tus fotos">
              {items.map((x, i) => (
                <button key={i} role="tab" aria-selected={i === current} onClick={() => setCurrent(i)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${i === current ? "border-carbon" : "border-transparent"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={x.prep.preview} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  {x.dest.length > 0 && <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-champagne ring-2 ring-blanco" />}
                </button>
              ))}
            </div>
          )}

          <h2 className="mt-7 text-[26px]">¿Dónde quieres compartirla?</h2>
          <div className="mt-4 space-y-3">
            <DestinationCard title="Pantalla del evento" detail="Aparece en la pantalla durante la celebración, con tu mensaje si quieres." selected={it.dest.includes("screen")} onToggle={() => toggle(current, "screen")} icon={<ScreenIcon />} />
            <DestinationCard title="Álbum compartido" detail="Queda en el álbum digital; los invitados pueden verla y descargarla." selected={it.dest.includes("album")} onToggle={() => toggle(current, "album")} icon={<AlbumIcon />} />
          </div>

          {it.dest.includes("screen") && (
            <div className="mt-5">
              <label className="label" htmlFor="msg">Mensaje para la pantalla (opcional)</label>
              <textarea id="msg" className="field min-h-[96px] resize-none" maxLength={280} placeholder="Una dedicatoria para los novios"
                value={it.message} onChange={(e) => update(current, { message: e.target.value })} />
              <p className="mt-1 text-right text-[12px] text-piedra">{it.message.length}/280</p>
            </div>
          )}

          {items.length > 1 && it.dest.length > 0 && (
            <button onClick={applyToAll} className="mt-3 self-start text-[14px] text-carbon/70 underline underline-offset-4">Usar esta elección en todas las fotos</button>
          )}

          <div className="mt-auto space-y-3 pt-8">
            <button className="btn-primary w-full" disabled={!ready} onClick={() => setStep("revisar")}>
              {ready ? "Revisar envío" : `Elige un destino${items.length > 1 ? " para cada foto" : ""}`}
            </button>
            {items.length < props.maxFiles && <button className="btn-quiet w-full" onClick={() => gallery.current?.click()}>Agregar más fotos</button>}
          </div>
        </section>
      )}

      {(step === "revisar" || step === "enviando") && (
        <section className="flex flex-1 flex-col px-6 pt-8">
          <h2 className="text-[26px]">Revisa antes de enviar</h2>
          <ul className="mt-5 divide-y divide-carbon/10">
            {items.map((x, i) => (
              <li key={i} className="flex items-center gap-4 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={x.prep.preview} alt="" className="h-14 w-14 rounded-lg object-cover" />
                <div className="flex-1 text-[14px]">
                  <p>{x.dest.map((d) => (d === "screen" ? "Pantalla" : "Álbum")).join(" y ")}</p>
                  {x.message && <p className="truncate text-piedra">“{x.message}”</p>}
                  {x.state === "error" && <p className="text-[#8a3b2e]">{x.error}</p>}
                </div>
                {step === "enviando" && (
                  <span className="w-10 text-right text-[13px] tabular-nums text-piedra">
                    {x.state === "enviada" ? "Lista" : `${Math.round(x.progress * 100)}%`}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {error && <p className="mt-4 text-[14px] text-[#8a3b2e]" role="alert">{error}</p>}
          <div className="mt-auto space-y-3 pt-8">
            <button className="btn-primary w-full" disabled={step === "enviando"} onClick={send}>
              {step === "enviando" ? "Enviando…" : `Enviar ${items.length === 1 ? "foto" : `${items.length} fotos`}`}
            </button>
            {step === "revisar" && <button className="btn-quiet w-full" onClick={() => setStep("destinos")}>Volver</button>}
          </div>
        </section>
      )}

      {step === "listo" && (
        <section className="flex flex-1 flex-col px-6 pt-12">
          <svg width="44" height="44" viewBox="0 0 44 44" className="text-champagne" aria-hidden><circle cx="22" cy="22" r="21" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M14 22.5l5.5 5.5L30.5 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <h2 className="mt-6 text-[32px] leading-tight">{failed ? `Recibimos ${sent} de ${items.length} fotos` : "Recibimos tus fotos"}</h2>
          <p className="mt-3 text-[16px] text-carbon/75">
            {items.some((x) => x.dest.includes("screen")) && props.moderatedScreen
              ? "Las fotos para la pantalla aparecerán cuando los anfitriones las aprueben."
              : "Gracias por ser parte de los recuerdos de este día."}
          </p>
          <div className="mt-auto space-y-3 pt-10">
            {failed > 0 && <button className="btn-primary w-full" onClick={() => setStep("revisar")}>Reintentar las que faltan</button>}
            <button className={failed ? "btn-quiet w-full" : "btn-primary w-full"} onClick={() => { setItems([]); setCurrent(0); setStep("inicio"); }}>Compartir otra foto</button>
            {props.albumOpen && <Link className="btn-quiet w-full" href={`/e/${props.slug}/album`}>Ver el álbum</Link>}
          </div>
        </section>
      )}
    </main>
  );
}
