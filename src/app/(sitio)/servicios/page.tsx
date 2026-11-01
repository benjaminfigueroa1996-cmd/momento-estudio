import Link from "next/link";
import { services } from "@/content/site";

export const metadata = { title: "Servicios" };

export default function Services() {
  return (
    <main className="mx-auto max-w-4xl px-6 pt-12">
      <h1 className="text-[52px] leading-tight md:text-[72px]">Servicios</h1>
      <p className="mt-6 max-w-2xl text-[18px] text-carbon/80">Cada evento se cotiza a medida. Puedes combinar las experiencias según tu celebración.</p>
      <div className="mt-16 divide-y divide-carbon/10 border-y border-carbon/10">
        {services.map((s) => (
          <section key={s.id} id={s.id} className="grid gap-4 py-10 md:grid-cols-[1fr_1.4fr]">
            <h2 className="text-[34px] leading-tight">{s.title}</h2>
            <p className="text-[17px] leading-relaxed text-carbon/80">{s.body}</p>
          </section>
        ))}
      </div>
      <Link href="/contacto" className="btn-primary mt-16">Cotiza tu evento</Link>
    </main>
  );
}
