import Link from "next/link";
import { steps } from "@/content/site";

export const metadata = { title: "Cómo funciona" };

const rules = [
  ["Pantalla", "Se proyecta durante la celebración con su mensaje. No entra al álbum de invitados. Queda en el archivo de los anfitriones."],
  ["Álbum", "Los invitados la ven y la descargan. No se proyecta salvo que también se elija la pantalla."],
  ["Ambos", "Una sola foto con los dos destinos: se proyecta y queda en el álbum."],
];

export default function HowItWorks() {
  return (
    <main className="mx-auto max-w-4xl px-6 pt-12">
      <h1 className="text-[52px] leading-tight md:text-[72px]">Cómo funciona</h1>
      <ol className="mt-16 space-y-14">
        {steps.map((s, i) => (
          <li key={s.title} className="grid gap-4 md:grid-cols-[80px_1fr]">
            <span className="font-serif text-[40px] leading-none text-champagne">{i + 1}</span>
            <div><h2 className="text-[32px]">{s.title}</h2><p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-carbon/80">{s.body}</p></div>
          </li>
        ))}
      </ol>
      <section className="mt-24">
        <h2 className="text-[40px]">Tres formas de compartir</h2>
        <dl className="mt-8 divide-y divide-carbon/10 border-y border-carbon/10">
          {rules.map(([k, v]) => (<div key={k} className="grid gap-2 py-6 md:grid-cols-[180px_1fr]"><dt className="font-serif text-[26px]">{k}</dt><dd className="text-[16px] leading-relaxed text-carbon/80">{v}</dd></div>))}
        </dl>
      </section>
      <Link href="/contacto" className="btn-primary mt-16">Cotiza tu evento</Link>
    </main>
  );
}
