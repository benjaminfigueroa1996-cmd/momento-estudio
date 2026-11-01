"use client";

import { useState } from "react";
import { postJSON } from "@/lib/client/image";

export default function QuoteForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await postJSON("/api/cotizacion", { ...data, guests: data.guests ? Number(data.guests) : undefined });
      setState("sent");
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  }

  if (state === "sent") return <p className="text-[19px]">Recibimos tu solicitud. Te escribiremos pronto con una propuesta.</p>;

  return (
    <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
      <label className="block"><span className="label">Nombre</span><input name="name" required autoComplete="name" className="field" /></label>
      <label className="block"><span className="label">Correo electrónico</span><input name="email" type="email" required autoComplete="email" className="field" /></label>
      <label className="block"><span className="label">Teléfono</span><input name="phone" type="tel" autoComplete="tel" className="field" /></label>
      <label className="block"><span className="label">Tipo de evento</span>
        <select name="event_type" required className="field" defaultValue=""><option value="" disabled>Elige una opción</option><option>Matrimonio</option><option>Cumpleaños</option><option>Aniversario</option><option>Evento corporativo</option><option>Otro</option></select></label>
      <label className="block"><span className="label">Fecha</span><input name="event_date" type="date" className="field" /></label>
      <label className="block"><span className="label">Ciudad o lugar</span><input name="location" className="field" /></label>
      <label className="block"><span className="label">Invitados aproximados</span><input name="guests" type="number" min={1} max={5000} className="field" /></label>
      <label className="hidden" aria-hidden>No completar<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label className="block md:col-span-2"><span className="label">Comentarios</span><textarea name="comments" rows={4} className="field" /></label>
      {state === "error" && <p className="text-[14px] text-[#8a3b2e] md:col-span-2" role="alert">{error}</p>}
      <div className="md:col-span-2">
        <button className="btn-primary" disabled={state === "sending"}>{state === "sending" ? "Enviando…" : "Solicitar cotización"}</button>
        <p className="mt-3 text-[12px] text-piedra">Usamos estos datos solo para responder tu solicitud. <a href="/privacidad" className="underline">Privacidad</a></p>
      </div>
    </form>
  );
}
