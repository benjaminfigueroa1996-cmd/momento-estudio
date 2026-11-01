"use client";

export type LiveState = { paused: boolean; layout: string; show_qr: boolean; featured_media_id: string | null };

// Controles de la pantalla, compartidos por administración y por el operador
export default function LiveControls({ state, onChange }: { state: LiveState; onChange: (patch: Partial<LiveState>) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button className="btn-primary" onClick={() => onChange({ paused: !state.paused })}>{state.paused ? "Reanudar" : "Pausar"}</button>
      <label className="flex items-center gap-2 text-[15px]">Diseño
        <select className="field w-auto py-2" value={state.layout} onChange={(e) => onChange({ layout: e.target.value })}>
          <option value="auto">Automático</option><option value="full">Pantalla completa</option><option value="message">Foto con mensaje</option>
          <option value="mosaic">Mosaico</option><option value="gallery">Galería</option>
        </select></label>
      <button className="btn-quiet" onClick={() => onChange({ show_qr: !state.show_qr })}>{state.show_qr ? "Ocultar QR" : "Mostrar QR"}</button>
      {state.featured_media_id && <button className="btn-quiet" onClick={() => onChange({ featured_media_id: null })}>Quitar foto destacada</button>}
    </div>
  );
}
