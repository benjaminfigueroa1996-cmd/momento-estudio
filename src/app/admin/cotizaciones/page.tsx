import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { setQuoteStatus } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function Quotes() {
  await requireAdmin();
  const { data } = await db().from("quote_requests").select("*").order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as Record<string, string | number | null>[];
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-[44px]">Cotizaciones</h1>
      {rows.length === 0 && <p className="mt-6 text-piedra">Aún no llegan solicitudes desde el sitio.</p>}
      <ul className="mt-8 divide-y divide-carbon/10 border-y border-carbon/10">
        {rows.map((q) => (
          <li key={q.id as string} className="grid gap-2 py-5 md:grid-cols-[1fr_auto]">
            <div className="text-[15px]">
              <p className="text-[18px]">{q.name} <span className="text-piedra">· {q.event_type}</span></p>
              <p className="text-carbon/80"><a className="underline" href={`mailto:${q.email}`}>{q.email}</a>{q.phone ? ` · ${q.phone}` : ""}</p>
              <p className="text-piedra">{[q.event_date, q.location, q.guests ? `${q.guests} invitados` : null].filter(Boolean).join(" · ")}</p>
              {q.comments && <p className="mt-2 max-w-2xl">{q.comments}</p>}
            </div>
            <form action={async (f) => { "use server"; await setQuoteStatus(q.id as string, String(f.get("s"))); }} className="flex items-start gap-2">
              <select name="s" defaultValue={q.status as string} className="field w-auto py-2"><option>nueva</option><option>contactada</option><option>cotizada</option><option>cerrada</option><option>descartada</option></select>
              <button className="btn-quiet min-h-[44px]">Guardar</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
