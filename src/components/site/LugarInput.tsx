"use client";

import { useEffect, useRef, useState } from "react";

type Sugerencia = { id: string; titulo: string; detalle: string; lat?: number; lng?: number };
export type Lugar = { texto: string; lat?: number; lng?: number };

// Campo de lugar con sugerencias del mapa. Al elegir una, entrega las coordenadas para calcular el traslado.
export default function LugarInput({ onChange }: { onChange: (l: Lugar) => void }) {
  const [texto, setTexto] = useState("");
  const [items, setItems] = useState<Sugerencia[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const [verificado, setVerificado] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const session = useRef(typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random()).slice(2));
  const elegido = useRef("");

  useEffect(() => {
    if (texto === elegido.current || texto.trim().length < 3) { setItems([]); return; }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await fetch(`/api/lugares?q=${encodeURIComponent(texto)}&s=${session.current}`, { signal: ctl.signal });
        const d = r.ok ? ((await r.json()) as { sugerencias: Sugerencia[] }) : { sugerencias: [] };
        setItems(d.sugerencias.slice(0, 6));
        setAbierto(true);
        setActivo(-1);
      } catch { /* búsqueda cancelada */ } finally { setBuscando(false); }
    }, 300);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [texto]);

  async function elegir(s: Sugerencia) {
    const etiqueta = [s.titulo, s.detalle].filter(Boolean).join(", ");
    elegido.current = etiqueta;
    setTexto(etiqueta);
    setAbierto(false);
    let { lat, lng } = s;
    if (lat == null) {
      try {
        const r = await fetch(`/api/lugares?id=${encodeURIComponent(s.id)}&s=${session.current}`);
        if (r.ok) ({ lat, lng } = (await r.json()) as { lat: number; lng: number });
      } catch { /* sin coordenadas: queda como no verificado */ }
      session.current = crypto.randomUUID?.() ?? String(Math.random()).slice(2);
    }
    setVerificado(lat != null);
    onChange({ texto: etiqueta, lat, lng });
  }

  return (
    <div className="relative">
      <input
        name="location"
        className="field pr-10"
        autoComplete="off"
        placeholder="Escribe el centro de eventos o la dirección"
        role="combobox"
        aria-expanded={abierto && items.length > 0}
        aria-controls="lugar-lista"
        aria-autocomplete="list"
        value={texto}
        onChange={(e) => { setTexto(e.target.value); setVerificado(false); onChange({ texto: e.target.value }); }}
        onFocus={() => items.length && setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
        onKeyDown={(e) => {
          if (!abierto || !items.length) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActivo((a) => Math.min(items.length - 1, a + 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActivo((a) => Math.max(0, a - 1)); }
          else if (e.key === "Enter" && activo >= 0) { e.preventDefault(); elegir(items[activo]); }
          else if (e.key === "Escape") setAbierto(false);
        }}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px]" aria-hidden>
        {verificado ? <span className="text-[#5d7a5a]">✓</span> : buscando ? <span className="text-piedra">…</span> : null}
      </span>
      {abierto && items.length > 0 && (
        <ul id="lugar-lista" role="listbox" className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-carbon/10 bg-blanco shadow-[0_12px_40px_rgba(36,35,33,0.14)]">
          {items.map((s, i) => (
            <li key={s.id} role="option" aria-selected={i === activo}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => elegir(s)}
                className={`block w-full px-4 py-3 text-left ${i === activo ? "bg-marfil" : "hover:bg-marfil"}`}>
                <span className="block text-[15px] text-carbon">{s.titulo}</span>
                {s.detalle && <span className="block text-[12px] text-piedra">{s.detalle}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      <span className="mt-1 block text-[12px] text-piedra">{verificado ? "Lugar verificado en el mapa." : "Elige una opción de la lista para calcular el traslado."}</span>
    </div>
  );
}
