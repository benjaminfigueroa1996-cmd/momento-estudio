import type { EventRow } from "@/lib/db";

const local = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("sv-SE", { timeZone: "America/Santiago" }).slice(0, 16).replace(" ", "T") : "");

export default function EventForm({ action, ev, submit }: { action: (f: FormData) => Promise<void>; ev?: EventRow; submit: string }) {
  const n = (name: keyof EventRow, label: string, def: number, hint?: string) => (
    <label className="block"><span className="label">{label}</span>
      <input name={name} type="number" className="field" defaultValue={(ev?.[name] as number) ?? def} />
      {hint && <span className="mt-1 block text-[12px] text-piedra">{hint}</span>}</label>
  );
  const c = (name: keyof EventRow, label: string, def: boolean) => (
    <label className="flex items-center gap-3 py-1 text-[15px]"><input type="checkbox" name={name} defaultChecked={(ev?.[name] as boolean) ?? def} className="h-5 w-5 accent-carbon" />{label}</label>
  );
  const d = (name: keyof EventRow, label: string, hint: string) => (
    <label className="block"><span className="label">{label}</span>
      <input name={name} type="datetime-local" className="field" defaultValue={local(ev?.[name] as string | null)} />
      <span className="mt-1 block text-[12px] text-piedra">{hint}</span></label>
  );
  return (
    <form action={action} className="grid gap-10">
      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-2 font-serif text-[26px]">Evento</legend>
        <label className="block"><span className="label">Nombre del evento</span><input name="name" required className="field" defaultValue={ev?.name} placeholder="Matrimonio de Ana y Luis" /></label>
        <label className="block"><span className="label">Anfitriones</span><input name="hosts_names" required className="field" defaultValue={ev?.hosts_names} placeholder="Francisca & Benjamín" /></label>
        <label className="block"><span className="label">Enlace (slug)</span><input name="slug" required className="field" defaultValue={ev?.slug} placeholder="ana-y-luis" />
          <span className="mt-1 block text-[12px] text-piedra">Minúsculas, números y guiones. Queda en el QR.</span></label>
        <label className="block"><span className="label">Fecha y hora (Santiago)</span><input name="starts_at" type="datetime-local" required className="field" defaultValue={local(ev?.starts_at)} /></label>
        <label className="block"><span className="label">Ciudad o lugar</span><input name="city" className="field" defaultValue={ev?.city ?? ""} /></label>
        <label className="block"><span className="label">Tipo de evento</span>
          <select name="event_type" className="field" defaultValue={ev?.event_type ?? "matrimonio"}>
            <option value="matrimonio">Matrimonio</option><option value="cumpleanos">Cumpleaños</option>
            <option value="celebracion">Celebración</option><option value="corporativo">Evento corporativo</option><option value="otro">Otro</option>
          </select></label>
        <label className="block"><span className="label">Frase en pantalla</span>
          <input name="tagline" maxLength={60} className="field" defaultValue={ev?.tagline ?? ""} placeholder="¡Que siga la fiesta!" />
          <span className="mt-1 block text-[12px] text-piedra">Vacío: se usa la frase según el tipo de evento.</span></label>
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-2 font-serif text-[26px]">Pantalla y moderación</legend>
        {n("screen_slide_seconds", "Segundos entre fotos nuevas en pantalla", 10, "Cada foto permanece en el muro unas 7 veces este tiempo (mínimo 45 s) y no se repite.")}
        {n("screen_ttl_minutes", "Minutos que una foto queda en la rotación", 45, "Después sale de la pantalla y sigue en el archivo privado.")}
        <div>{c("moderate_screen", "Aprobar antes de mostrar en pantalla", true)}{c("moderate_album", "Aprobar antes de publicar en el álbum", false)}{c("hosts_can_moderate", "Los anfitriones también pueden aprobar", true)}</div>
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-2 font-serif text-[26px]">Álbum y cargas</legend>
        <div>{c("album_enabled", "Álbum visible para invitados", true)}{c("guest_downloads", "Invitados pueden descargar", true)}</div>
        {n("max_uploads_per_guest", "Fotos máximas por invitado", 30)}
        {n("max_file_mb", "Tamaño máximo por foto (MB)", 25)}
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-2 font-serif text-[26px]">Plazos</legend>
        {d("uploads_close_at", "Cierre de recepción de fotos", "No elimina fotos.")}
        {d("album_until", "Álbum disponible hasta", "Después el álbum se oculta a invitados; los anfitriones conservan todo.")}
        {d("host_access_until", "Acceso privado vigente hasta", "Vacío: sin vencimiento.")}
        {d("retention_until", "Conservar archivos hasta", "Solo informativo: la eliminación definitiva requiere aprobación manual.")}
      </fieldset>

      <div><button className="btn-primary">{submit}</button></div>
    </form>
  );
}
