import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatCLP, type QuoteLine } from "@/lib/pricing";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cotización", robots: { index: false, follow: false } };

type Row = {
  number: number; name: string; email: string; phone: string | null; event_type: string; event_date: string | null;
  location: string | null; guests: number | null; created_at: string; valid_until: string | null; total: number;
  quote: { lineas: QuoteLine[]; neto: number; iva: number; total: number; ivaPct: number; reservaPct: number };
};

const fecha = (d: string | null, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) =>
  d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString("es-CL", { timeZone: "America/Santiago", ...opts }) : "";

export default async function Cotizacion({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) notFound();
  const { data } = await db().from("quote_requests").select("number,name,email,phone,event_type,event_date,location,guests,created_at,valid_until,total,quote").eq("token", token).maybeSingle();
  if (!data?.quote) notFound();
  const q = data as Row;
  const { data: s } = await db().from("settings").select("key,value").in("key", ["contact_email", "contact_phone", "contact_instagram"]);
  const c = Object.fromEntries(((s ?? []) as { key: string; value: string }[]).map((r) => [r.key, r.value]));
  const numero = String(q.number).padStart(4, "0");
  const vencida = q.valid_until ? new Date(`${q.valid_until}T23:59:59-03:00`) < new Date() : false;
  const reserva = Math.round((q.quote.total * q.quote.reservaPct) / 100);
  const wa = c.contact_phone ? c.contact_phone.replace(/\D/g, "") : "";
  const mensaje = encodeURIComponent(`Hola, quiero reservar la fecha de la cotización N° ${numero}.`);

  return (
    <main className="min-h-screen bg-marfil px-4 py-10 print:bg-white print:p-0">
      <style>{`@page{size:A4;margin:14mm}@media print{html,body{background:#fff!important}}`}</style>
      <div className="mx-auto mb-6 flex max-w-[800px] flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-[14px] text-piedra">{vencida ? "Esta cotización está vencida. Escríbenos y la actualizamos." : "Tu cotización está lista. Puedes descargarla o reservar tu fecha."}</p>
        <div className="flex flex-wrap gap-2">
          {wa && <a href={`https://wa.me/${wa}?text=${mensaje}`} className="btn-quiet">Reservar por WhatsApp</a>}
          {c.contact_email && <a href={`mailto:${c.contact_email}?subject=${encodeURIComponent(`Reserva cotización N° ${numero}`)}&body=${mensaje}`} className="btn-quiet">Reservar por correo</a>}
          <PrintButton />
        </div>
      </div>

      <article className="mx-auto max-w-[800px] bg-blanco px-8 py-10 text-carbon shadow-[0_20px_60px_rgba(36,35,33,0.08)] md:px-14 md:py-14 print:max-w-none print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-end justify-between gap-6 border-b border-champagne pb-6">
          <div>
            <p className="font-serif text-[34px] leading-none">Momento Estudio</p>
            <p className="mt-2 text-[13px] text-piedra">Fotos y mensajes en vivo para eventos</p>
          </div>
          <div className="text-right text-[13px] leading-relaxed">
            <p className="font-serif text-[22px] leading-none">Cotización N° {numero}</p>
            <p className="mt-2 text-piedra">Emitida el {fecha(q.created_at)}</p>
            {q.valid_until && <p className="text-piedra">Válida hasta el {fecha(q.valid_until)}</p>}
          </div>
        </header>

        <section className="grid gap-6 py-8 text-[14px] leading-relaxed sm:grid-cols-2">
          <div>
            <p className="text-[12px] text-champagne">Cliente</p>
            <p className="mt-1 text-[16px]">{q.name}</p>
            <p className="text-carbon/70">{q.email}</p>
            {q.phone && <p className="text-carbon/70">{q.phone}</p>}
          </div>
          <div>
            <p className="text-[12px] text-champagne">Evento</p>
            <p className="mt-1 text-[16px]">{q.event_type}</p>
            <p className="text-carbon/70">{[fecha(q.event_date), q.location].filter(Boolean).join(", ") || "Fecha por confirmar"}</p>
            {q.guests && <p className="text-carbon/70">{q.guests} invitados aproximados</p>}
          </div>
        </section>

        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr className="border-y border-carbon/15 text-left text-[12px] text-piedra">
              <th className="py-3 font-normal">Detalle</th>
              <th className="py-3 text-right font-normal">Valor</th>
            </tr>
          </thead>
          <tbody>
            {q.quote.lineas.map((l, i) => (
              <tr key={i} className="border-b border-carbon/10 align-top">
                <td className="py-4 pr-6">
                  <p className="text-[15px]">{l.concepto}</p>
                  {l.detalle && <p className="mt-1 max-w-[52ch] text-[13px] leading-relaxed text-carbon/65">{l.detalle}</p>}
                </td>
                <td className="whitespace-nowrap py-4 text-right tabular-nums">{formatCLP(l.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-6 w-full max-w-[300px] text-[14px] tabular-nums">
          <div className="flex justify-between py-1.5"><span className="text-carbon/70">Neto</span><span>{formatCLP(q.quote.neto)}</span></div>
          <div className="flex justify-between py-1.5"><span className="text-carbon/70">IVA ({q.quote.ivaPct}%)</span><span>{formatCLP(q.quote.iva)}</span></div>
          <div className="mt-2 flex items-baseline justify-between border-t border-carbon pt-3"><span className="font-serif text-[20px]">Total</span><span className="text-[20px]">{formatCLP(q.quote.total)}</span></div>
        </div>

        <section className="mt-10 rounded-2xl bg-marfil p-6 text-[13px] leading-relaxed text-carbon/80 print:border print:border-carbon/15 print:bg-white">
          <p className="font-serif text-[18px] text-carbon">Condiciones</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>La fecha se reserva con el {q.quote.reservaPct}% del total ({formatCLP(reserva)}). El saldo se paga hasta 7 días antes del evento.</li>
            <li>La plataforma funciona durante todo el evento. Las horas de fotógrafo y ayudante se coordinan con ustedes antes del evento.</li>
            <li>Después del evento, el archivo privado con todas las fotos y mensajes queda disponible para descargar.</li>
            {q.valid_until && <li>Valores válidos hasta el {fecha(q.valid_until)}, sujetos a disponibilidad de la fecha.</li>}
          </ul>
        </section>

        <footer className="mt-10 flex flex-wrap justify-between gap-4 border-t border-carbon/10 pt-6 text-[13px] text-piedra">
          <p className="font-serif text-[16px] text-carbon">Momento Estudio</p>
          <p>{[c.contact_email, c.contact_phone, c.contact_instagram ? `@${c.contact_instagram.replace(/^@/, "")}` : ""].filter(Boolean).join("   ")}</p>
        </footer>
      </article>
    </main>
  );
}
