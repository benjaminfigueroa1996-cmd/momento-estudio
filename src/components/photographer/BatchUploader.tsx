"use client";

import { useRef, useState } from "react";
import { prepare, put, postJSON, sha256 } from "@/lib/client/image";

type Row = { file: File; state: "en cola" | "preparando" | "subiendo" | "lista" | "duplicada" | "error"; progress: number; error?: string };
type Ticket = { mediaId: string; original: string; display: string; thumb: string };

const CONCURRENCY = 4;

export default function BatchUploader({ token, photographer, event, hosts, maxMb }: { token: string; photographer: string; event: string; hosts: string; maxMb: number }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const folder = useRef<HTMLInputElement>(null);

  const set = (i: number, patch: Partial<Row>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  function add(list: FileList | null) {
    if (!list) return;
    const files = Array.from(list).filter((f) => /^image\//.test(f.type) || /\.(heic|jpe?g|png|webp)$/i.test(f.name));
    setRows((r) => [...r, ...files.map((file) => ({ file, state: "en cola" as const, progress: 0 }))]);
  }

  async function uploadOne(i: number, file: File) {
    try {
      if (file.size > maxMb * 1024 * 1024) throw new Error(`Supera ${maxMb} MB`);
      set(i, { state: "preparando", error: undefined });
      const [hash, prep] = await Promise.all([sha256(file), prepare(file)]);
      const type = prep.type || "image/jpeg";
      const { tickets, duplicates } = await postJSON<{ tickets: Ticket[]; duplicates: string[] }>(`/api/fotografo/${token}/uploads`, {
        files: [{ type, size: file.size, name: file.name, sha256: hash }],
      });
      if (duplicates.length) return set(i, { state: "duplicada", progress: 1 });
      const t = tickets[0];
      set(i, { state: "subiendo" });
      await put(t.original, file, type, (p) => set(i, { progress: p * 0.9 }));
      if (prep.display) await put(t.display, prep.display, "image/jpeg");
      if (prep.thumb) await put(t.thumb, prep.thumb, "image/jpeg");
      await postJSON(`/api/fotografo/${token}/complete`, { mediaId: t.mediaId, filename: file.name, width: prep.width, height: prep.height });
      URL.revokeObjectURL(prep.preview);
      set(i, { state: "lista", progress: 1 });
    } catch (e) {
      set(i, { state: "error", error: (e as Error).message });
    }
  }

  async function start(onlyErrors = false) {
    setRunning(true);
    const queue = rows.map((r, i) => ({ r, i })).filter(({ r }) => (onlyErrors ? r.state === "error" : r.state === "en cola" || r.state === "error"));
    const worker = async () => {
      for (let n = queue.shift(); n; n = queue.shift()) await uploadOne(n.i, n.r.file);
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    setRunning(false);
  }

  const count = (s: Row["state"]) => rows.filter((r) => r.state === s).length;
  const done = count("lista") + count("duplicada");
  const total = rows.length;
  const pct = total ? Math.round((rows.reduce((a, r) => a + r.progress, 0) / total) * 100) : 0;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-[13px] text-piedra">Carga del fotógrafo oficial · {photographer}</p>
      <h1 className="mt-2 text-[44px] leading-tight">{event}</h1>
      <p className="mt-1 text-carbon/70">{hosts}</p>
      <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-carbon/80">
        Las fotos que subas aquí van directo al álbum del evento y al archivo de los anfitriones. No aparecen en la pantalla. Recomendamos JPG en alta calidad; las fotos repetidas se omiten solas.
      </p>

      <input ref={input} type="file" accept="image/*,.heic" multiple hidden onChange={(e) => add(e.target.files)} />
      {/* @ts-expect-error: webkitdirectory no está en los tipos de React */}
      <input ref={folder} type="file" webkitdirectory="" multiple hidden onChange={(e) => add(e.target.files)} />

      <div className="mt-8 flex flex-wrap gap-3">
        <button className="btn-quiet" onClick={() => input.current?.click()} disabled={running}>Elegir fotos</button>
        <button className="btn-quiet" onClick={() => folder.current?.click()} disabled={running}>Elegir una carpeta</button>
        <button className="btn-primary" onClick={() => start()} disabled={running || !rows.some((r) => r.state === "en cola")}>
          {running ? "Subiendo…" : `Subir ${count("en cola") || ""} fotos`}
        </button>
      </div>

      {total > 0 && (
        <section className="mt-10">
          <div className="flex items-baseline justify-between text-[14px]">
            <span>{done} de {total} listas{count("duplicada") ? ` · ${count("duplicada")} repetidas omitidas` : ""}</span>
            <span className="tabular-nums text-piedra">{pct}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-beige"><div className="h-full bg-carbon transition-[width] duration-300" style={{ width: `${pct}%` }} /></div>

          {count("error") > 0 && !running && (
            <div className="mt-5 flex items-center justify-between rounded-xl border border-[#8a3b2e]/30 bg-blanco px-4 py-3 text-[14px]">
              <span>{count("error")} fotos no se pudieron subir.</span>
              <button className="font-medium underline underline-offset-4" onClick={() => start(true)}>Reintentar</button>
            </div>
          )}
          {!running && done === total && <p className="mt-6 text-[17px]">Listo. Todas las fotos quedaron en el álbum del evento.</p>}

          <ul className="mt-6 max-h-[50vh] divide-y divide-carbon/10 overflow-y-auto text-[14px]">
            {rows.map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-4 py-2">
                <span className="truncate">{r.file.name}</span>
                <span className={`shrink-0 ${r.state === "error" ? "text-[#8a3b2e]" : "text-piedra"}`}>
                  {r.state === "subiendo" ? `${Math.round(r.progress * 100)}%` : r.state === "error" ? r.error : r.state}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
