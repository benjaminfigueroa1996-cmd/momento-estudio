"use client";

import { useState } from "react";
import Link from "next/link";
import { postJSON, prepare, put } from "@/lib/client/image";
import LiveControls from "@/components/live/LiveControls";

type Props = {
  eventId: string;
  urls: { guests: string; album: string; live: string; hosts: string };
  hasHostAccess: boolean;
  links: { id: string; name: string; revoked_at: string | null }[];
  devices: { id: string; name: string; last_seen_at: string | null; revoked_at: string | null; paired: boolean }[];
  operators: { id: string; name: string; revoked_at: string | null }[];
  hasCover: boolean;
  hasLogo: boolean;
  theme: { bg?: string; overlay?: number; bgKey?: string };
  live: { paused: boolean; layout: string; show_qr: boolean; featured_media_id: string | null };
};

const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border-t border-carbon/10 py-8"><h2 className="text-[26px]">{title}</h2><div className="mt-4">{children}</div></section>
);

export default function EventTools({ eventId, urls, hasHostAccess, links, devices, operators, hasCover, hasLogo, theme, live }: Props) {
  const base = `/api/admin/eventos/${eventId}`;
  const [hostCode, setHostCode] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [pair, setPair] = useState<{ name: string; code: string } | null>(null);
  const [state, setState] = useState(live);
  const [msg, setMsg] = useState<string | null>(null);
  const [opUrl, setOpUrl] = useState<string | null>(null);

  const [bg, setBg] = useState(theme.bg ?? "calido");
  const [overlay, setOverlay] = useState(theme.overlay ?? 0.45);
  const saveBg = (next: string, ov = overlay) => call(async () => { await postJSON(`${base}/fondo`, { bg: next, overlay: ov }); setBg(next); }, "Fondo actualizado. La pantalla lo toma en unos segundos.");
  async function uploadBg(file: File) {
    if (!/^image\/(png|jpeg)$/.test(file.type)) throw new Error("El fondo debe ser JPG o PNG.");
    const prep = await prepare(file); // se reduce a 2048 px para que cargue rápido
    const blob = prep.display ?? file;
    const { url } = await postJSON<{ url: string; type: string }>(`${base}/fondo?subir=1&type=image/jpeg`, {});
    await put(url, blob, "image/jpeg");
    const r = await fetch(`${base}/fondo`, { method: "PUT" });
    if (!r.ok) throw new Error((await r.json()).error);
    setBg("imagen");
  }

  async function uploadLogo(file: File) {
    if (!/^image\/(png|jpeg)$/.test(file.type)) throw new Error("El logo debe ser PNG o JPEG.");
    const { url, type } = await postJSON<{ url: string; type: string }>(`${base}/logo?type=${encodeURIComponent(file.type)}`, {});
    await put(url, file, type);
    const r = await fetch(`${base}/logo`, { method: "PUT" });
    if (!r.ok) throw new Error((await r.json()).error);
  }

  async function uploadCover(file: File) {
    const prep = await prepare(file);
    if (!prep.display) throw new Error("No se pudo leer la imagen. Usa JPG o PNG.");
    const { url } = await postJSON<{ url: string }>(`${base}/portada`, {});
    await put(url, prep.display, "image/jpeg");
    const r = await fetch(`${base}/portada`, { method: "PUT" });
    if (!r.ok) throw new Error((await r.json()).error);
  }

  const call = async (fn: () => Promise<unknown>, ok?: string) => {
    try { await fn(); if (ok) setMsg(ok); } catch (e) { setMsg((e as Error).message); }
  };
  const liveSet = (patch: Partial<typeof live>) => call(async () => { await postJSON(`${base}/pantalla`, patch); setState((s) => ({ ...s, ...patch })); });
  const copy = (t: string) => navigator.clipboard.writeText(t).then(() => setMsg("Copiado."));

  return (
    <div className="mt-10">
      {msg && <p className="mb-4 rounded-xl bg-marfil px-4 py-3 text-[14px]" role="status" onClick={() => setMsg(null)}>{msg}</p>}

      <Block title="Enlaces y QR">
        <ul className="space-y-2 text-[15px]">
          {([["Invitados (QR)", urls.guests], ["Álbum", urls.album], ["Pantalla en vivo", urls.live], ["Anfitriones", urls.hosts]] as const).map(([k, v]) => (
            <li key={k} className="flex flex-wrap items-center gap-3"><span className="w-40 text-piedra">{k}</span>
              <a href={v} target="_blank" className="truncate underline underline-offset-4">{v.replace(/\?k=.*/, "?k=…")}</a>
              <button className="text-[13px] text-carbon/70 underline" onClick={() => copy(v)}>Copiar</button></li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
          <a className="btn-quiet" href={`${base}/qr?format=svg`}>QR en SVG</a>
          <a className="btn-quiet" href={`${base}/qr?format=png`}>QR en PNG</a>
          <Link className="btn-quiet" href={`/admin/eventos/${eventId}/tarjeta`} target="_blank">Tarjeta imprimible</Link>
        </div>
      </Block>

      <Block title="Pantalla en vivo">
        <LiveControls state={state} onChange={liveSet} />
        <p className="mt-3 text-[13px] text-piedra">Los cambios llegan a la pantalla en unos 4 segundos. Doble clic en la pantalla activa el modo pantalla completa.</p>
      </Block>

      <Block title="Portada del evento">
        <p className="text-[15px] text-carbon/80">{hasCover ? "El evento tiene portada." : "Sin portada."} Se muestra arriba en la página del QR. Usa una foto horizontal.</p>
        <label className="btn-quiet mt-4 cursor-pointer">Elegir imagen
          <input type="file" accept="image/jpeg,image/png" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) call(() => uploadCover(f), "Portada actualizada. Recarga para verla."); }} /></label>
        {hasCover && <button className="btn-quiet ml-3" onClick={() => call(() => fetch(`${base}/portada`, { method: "DELETE" }), "Portada quitada.")}>Quitar portada</button>}
      </Block>

      <Block title="Fondo de la pantalla">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([
            ["calido", "Cálido", "radial-gradient(ellipse at 30% 110%,rgba(183,154,112,.45),transparent 60%),radial-gradient(circle at 80% 20%,rgba(255,200,130,.25),transparent 30%),#242321"],
            ["carbon", "Carbón liso", "#242321"],
            ["lino", "Lino claro", "radial-gradient(ellipse at 50% 0%,#fffdf8,#efe6d8)"],
            ["imagen", "Imagen propia", theme.bgKey ? "linear-gradient(135deg,#3a3633,#1e1d1b)" : "repeating-linear-gradient(45deg,#e8dfd3 0 8px,#f7f3ed 8px 16px)"],
          ] as const).map(([id, label, css]) => (
            <button key={id} onClick={() => (id === "imagen" && !theme.bgKey ? undefined : saveBg(id))}
              className={`overflow-hidden rounded-xl border text-left ${bg === id ? "border-carbon ring-2 ring-carbon" : "border-carbon/15"}`}>
              <span className="block h-16" style={{ background: css }} />
              <span className="block px-3 py-2 text-[13px]">{label}{id === "imagen" && !theme.bgKey ? " (sube una)" : ""}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <label className="btn-quiet cursor-pointer">Subir imagen de fondo
            <input type="file" accept="image/jpeg,image/png" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) call(() => uploadBg(f), "Fondo subido. Recarga esta página para verlo marcado."); }} /></label>
          {bg === "imagen" && (
            <label className="flex items-center gap-3 text-[14px]">Oscurecer la imagen
              <input type="range" min={0} max={0.85} step={0.05} value={overlay} onChange={(e) => setOverlay(Number(e.target.value))}
                onMouseUp={() => saveBg("imagen", overlay)} onTouchEnd={() => saveBg("imagen", overlay)} className="accent-carbon" />
              <span className="w-10 tabular-nums text-piedra">{Math.round(overlay * 100)}%</span></label>
          )}
        </div>
        <p className="mt-3 text-[13px] text-piedra">Para empresas: sube su imagen de marca como fondo y su logo más abajo. Oscurece la imagen si el QR o los textos no se leen bien.</p>
      </Block>

      <Block title="Logo del evento (opcional)">
        <p className="text-[15px] text-carbon/80">{hasLogo ? "El evento tiene logo." : "Sin logo."} Aparece en la pantalla en vivo junto al nombre del evento. Ideal: PNG con fondo transparente.</p>
        <label className="btn-quiet mt-4 cursor-pointer">Elegir logo
          <input type="file" accept="image/png,image/jpeg" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) call(() => uploadLogo(f), "Logo actualizado."); }} /></label>
        {hasLogo && <button className="btn-quiet ml-3" onClick={() => call(() => fetch(`${base}/logo`, { method: "DELETE" }), "Logo quitado.")}>Quitar logo</button>}
      </Block>

      <Block title="Operador de pantalla">
        <p className="text-[15px] text-carbon/80">Un enlace para quien maneje la pantalla en el evento: puede pausar, cambiar diseño, destacar y retirar fotos de la pantalla. No ve el archivo privado ni la administración.</p>
        <form className="mt-4 flex flex-wrap gap-3" onSubmit={(e) => { e.preventDefault(); const name = new FormData(e.currentTarget).get("name"); call(async () => setOpUrl((await postJSON<{ url: string }>(`${base}/operador`, { name })).url)); }}>
          <input name="name" className="field max-w-xs" placeholder="Nombre del operador" required />
          <button className="btn-primary">Crear enlace</button>
        </form>
        {opUrl && <p className="mt-4 break-all rounded-xl bg-marfil px-4 py-3 text-[14px]">{opUrl} <button className="ml-2 underline" onClick={() => copy(opUrl)}>Copiar</button></p>}
        <ul className="mt-4 text-[14px]">{operators.map((o) => (
          <li key={o.id} className="flex gap-4 py-1"><span>{o.name}</span>
            {o.revoked_at ? <span className="text-piedra">revocado</span> : <button className="underline" onClick={() => call(() => fetch(`${base}/operador?link=${o.id}`, { method: "DELETE" }), "Enlace revocado.")}>Revocar</button>}</li>
        ))}</ul>
      </Block>

      <Block title="Acceso de anfitriones">
        <p className="text-[15px] text-carbon/80">{hasHostAccess ? "Hay un código activo." : "Aún no hay código."} El código solo se muestra una vez; generar uno nuevo anula el anterior.</p>
        {hostCode && <p className="mt-4 rounded-xl border border-champagne bg-marfil px-5 py-4 font-medium tracking-[0.15em]">{hostCode}</p>}
        <div className="mt-4 flex gap-3">
          <button className="btn-primary" onClick={() => call(async () => setHostCode((await postJSON<{ code: string }>(`${base}/acceso`, {})).code))}>Generar código</button>
          {hasHostAccess && <button className="btn-quiet" onClick={() => call(() => fetch(`${base}/acceso`, { method: "DELETE" }), "Acceso revocado.")}>Revocar acceso</button>}
        </div>
      </Block>

      <Block title="Fotógrafo">
        <form className="flex flex-wrap gap-3" onSubmit={(e) => { e.preventDefault(); const name = new FormData(e.currentTarget).get("name"); call(async () => setPhotoUrl((await postJSON<{ url: string }>(`${base}/fotografo`, { name })).url)); }}>
          <input name="name" className="field max-w-xs" placeholder="Nombre del fotógrafo" required />
          <button className="btn-primary">Crear enlace de carga</button>
        </form>
        {photoUrl && <p className="mt-4 break-all rounded-xl bg-marfil px-4 py-3 text-[14px]">{photoUrl} <button className="ml-2 underline" onClick={() => copy(photoUrl)}>Copiar</button></p>}
        <ul className="mt-4 text-[14px]">{links.map((l) => (
          <li key={l.id} className="flex gap-4 py-1"><span>{l.name}</span>
            {l.revoked_at ? <span className="text-piedra">revocado</span> : <button className="underline" onClick={() => call(() => fetch(`${base}/fotografo?link=${l.id}`, { method: "DELETE" }), "Enlace revocado.")}>Revocar</button>}</li>
        ))}</ul>
      </Block>

      <Block title="Estaciones iPad">
        <form className="flex flex-wrap gap-3" onSubmit={(e) => { e.preventDefault(); const name = String(new FormData(e.currentTarget).get("name")); call(async () => setPair({ name, code: (await postJSON<{ code: string }>(`${base}/ipad`, { name })).code })); }}>
          <input name="name" className="field max-w-xs" placeholder="iPad 1" required />
          <button className="btn-primary">Agregar iPad</button>
        </form>
        {pair && <p className="mt-4 rounded-xl border border-champagne bg-marfil px-5 py-4">Código para {pair.name}: <strong className="tracking-[0.2em]">{pair.code}</strong> (vence en 15 minutos)</p>}
        <ul className="mt-4 text-[14px]">{devices.map((d) => (
          <li key={d.id} className="flex flex-wrap gap-4 py-1"><span>{d.name}</span>
            <span className="text-piedra">{d.revoked_at ? "revocado" : d.paired ? `vinculado${d.last_seen_at ? `, visto ${new Date(d.last_seen_at).toLocaleTimeString("es-CL")}` : ""}` : "sin vincular"}</span>
            {!d.revoked_at && <button className="underline" onClick={() => call(async () => setPair({ name: d.name, code: (await postJSON<{ code: string }>(`${base}/ipad`, { name: d.name, deviceId: d.id })).code }))}>Nuevo código</button>}
            {!d.revoked_at && <button className="underline" onClick={() => call(() => fetch(`${base}/ipad?device=${d.id}`, { method: "DELETE" }), "iPad revocado.")}>Revocar</button>}</li>
        ))}</ul>
      </Block>
    </div>
  );
}
