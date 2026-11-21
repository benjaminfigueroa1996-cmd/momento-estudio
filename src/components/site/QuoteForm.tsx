"use client";

import { useEffect, useMemo, useState } from "react";
import { postJSON } from "@/lib/client/image";
import { DEFAULT_PRICING, calcularCotizacion, formatCLP, type Paquete, type PricingConfig } from "@/lib/pricing";

export default function QuoteForm() {
  const [cfg, setCfg] = useState<PricingConfig>(DEFAULT_PRICING);
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");
  const [paquete, setPaquete] = useState<Paquete>("completo");
  const [invitados, setInvitados] = useState("");
  const [fecha, setFecha] = useState("");
  const [segundoFotografo, setSegundoFotografo] = useState(false);
  const [segundoIpad, setSegundoIpad] = useState(false);
  const [horasExtra, setHorasExtra] = useState(0);
  const [fueraDeSantiago, setFuera] = useState(false);

  useEffect(() => {
    fetch("/api/precios").then((r) => (r.ok ? r.json() : null)).then((c) => c && setCfg(c)).catch(() => null);
  }, []);

  const cot = useMemo(
    () => calcularCotizacion(cfg, { paquete, invitados: Number(invitados) || undefined, fecha, segundoFotografo, segundoIpad, horasExtra, fueraDeSantiago }),
    [cfg, paquete, invitados, fecha, segundoFotografo, segundoIpad, horasExtra, fueraDeSantiago],
  );

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = (await postJSON("/api/cotizacion", {
        ...data,
        guests: invitados ? Number(invitados) : undefined,
        paquete, segundoFotografo, segundoIpad, horasExtra, fueraDeSantiago,
      })) as { token?: string };
      if (r?.token) window.location.href = `/cotizacion/${r.token}`;
      else setState("idle");
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  }

  const opcion = (p: Paquete, titulo: string, texto: string, precio: number) => (
    <label className={`block cursor-pointer rounded-2xl border p-4 transition-colors ${paquete === p ? "border-carbon bg-blanco" : "border-carbon/15 hover:border-carbon/40"}`}>
      <input type="radio" name="paquete_ui" className="sr-only" checked={paquete === p} onChange={() => setPaquete(p)} />
      <span className="flex items-baseline justify-between gap-3"><span className="text-[17px]">{titulo}</span><span className="text-[14px] text-carbon/70">desde {formatCLP(precio)} + IVA</span></span>
      <span className="mt-1 block text-[13px] leading-relaxed text-carbon/65">{texto}</span>
    </label>
  );

  return (
    <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
      <fieldset className="grid gap-3 md:col-span-2">
        <legend className="label">Elige tu experiencia</legend>
        {opcion("completo", "Paquete completo", `Plataforma durante todo el evento, estación iPad con Apple Pencil, fotógrafo y ayudante por ${cfg.horasFotografo} horas.`, cfg.completo)}
        {opcion("plataforma", "Solo plataforma", "QR, pantalla en vivo, álbum y archivo privado durante todo el evento. Ideal si ya tienes fotógrafo.", cfg.plataforma)}
      </fieldset>

      <label className="block"><span className="label">Tipo de evento</span>
        <select name="event_type" required className="field" defaultValue=""><option value="" disabled>Elige una opción</option><option>Matrimonio</option><option>Cumpleaños</option><option>Aniversario</option><option>Evento corporativo</option><option>Otro</option></select></label>
      <label className="block"><span className="label">Fecha del evento</span><input name="event_date" type="date" className="field" value={fecha} onChange={(e) => setFecha(e.target.value)} /></label>
      <label className="block"><span className="label">Invitados aproximados</span><input type="number" min={1} max={5000} required className="field" value={invitados} onChange={(e) => setInvitados(e.target.value)} /></label>
      <label className="block"><span className="label">Comuna o lugar</span><input name="location" className="field" /></label>

      {paquete === "completo" && (
        <fieldset className="grid gap-3 rounded-2xl border border-carbon/10 p-4 md:col-span-2">
          <legend className="px-1 text-sm text-carbon/80">Agrega si lo necesitas</legend>
          <label className="flex items-center justify-between gap-4 text-[15px]"><span><input type="checkbox" className="mr-3 accent-carbon" checked={segundoFotografo} onChange={(e) => setSegundoFotografo(e.target.checked)} />Segundo fotógrafo</span><span className="text-[13px] text-carbon/60">+{formatCLP(cfg.segundoFotografo)}</span></label>
          <label className="flex items-center justify-between gap-4 text-[15px]"><span><input type="checkbox" className="mr-3 accent-carbon" checked={segundoIpad} onChange={(e) => setSegundoIpad(e.target.checked)} />Segunda estación iPad</span><span className="text-[13px] text-carbon/60">+{formatCLP(cfg.segundoIpad)}</span></label>
          <label className="flex items-center justify-between gap-4 text-[15px]"><span>Horas adicionales de fotografía</span>
            <select className="field w-auto py-2" value={horasExtra} onChange={(e) => setHorasExtra(Number(e.target.value))}>{[0, 1, 2, 3, 4].map((h) => <option key={h} value={h}>{h === 0 ? "Ninguna" : `${h} h`}</option>)}</select></label>
          <label className="flex items-center gap-3 text-[15px]"><input type="checkbox" className="accent-carbon" checked={fueraDeSantiago} onChange={(e) => setFuera(e.target.checked)} />El evento es fuera de Santiago</label>
        </fieldset>
      )}

      <div className="rounded-2xl bg-carbon p-5 text-marfil md:col-span-2" aria-live="polite">
        <ul className="space-y-1.5 text-[14px]">
          {cot.lineas.map((l) => <li key={l.concepto} className="flex justify-between gap-4"><span className="text-marfil/75">{l.concepto}</span><span className="tabular-nums">{formatCLP(l.monto)}</span></li>)}
          <li className="flex justify-between gap-4 text-marfil/60"><span>IVA ({cfg.ivaPct}%)</span><span className="tabular-nums">{formatCLP(cot.iva)}</span></li>
        </ul>
        <p className="mt-3 flex items-baseline justify-between border-t border-marfil/15 pt-3"><span className="font-serif text-[20px]">Total estimado</span><span className="text-[24px] tabular-nums">{formatCLP(cot.total)}</span></p>
        {!fecha && <p className="mt-2 text-[12px] text-marfil/55">Agrega la fecha para ver el valor exacto.</p>}
      </div>

      <label className="block"><span className="label">Nombre</span><input name="name" required autoComplete="name" className="field" /></label>
      <label className="block"><span className="label">Correo electrónico</span><input name="email" type="email" required autoComplete="email" className="field" /></label>
      <label className="block"><span className="label">Teléfono</span><input name="phone" type="tel" autoComplete="tel" className="field" /></label>
      <label className="block"><span className="label">Comentarios</span><input name="comments" className="field" /></label>
      <label className="hidden" aria-hidden>No completar<input name="website" tabIndex={-1} autoComplete="off" /></label>
      {state === "error" && <p className="text-[14px] text-[#8a3b2e] md:col-span-2" role="alert">{error}</p>}
      <div className="md:col-span-2">
        <button className="btn-primary" disabled={state === "sending"}>{state === "sending" ? "Generando…" : "Recibir mi cotización"}</button>
        <p className="mt-3 text-[12px] text-piedra">Recibirás la cotización formal al instante. Usamos estos datos solo para responder tu solicitud. <a href="/privacidad" className="underline">Privacidad</a></p>
      </div>
    </form>
  );
}
