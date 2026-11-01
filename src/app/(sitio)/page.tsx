import Link from "next/link";
import Frames from "@/components/site/Frames";
import { steps, services, faqs } from "@/content/site";
import QuoteForm from "@/components/site/QuoteForm";

export default function Home() {
  return (
    <main>
      <section className="mx-auto max-w-6xl px-6 pt-10 md:pt-20">
        <h1 className="max-w-4xl text-[48px] leading-[1.02] md:text-[88px]">Los recuerdos de tu evento, desde todos los ángulos.</h1>
        <div className="mt-10 grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <p className="max-w-xl text-[18px] leading-relaxed text-carbon/80">
            En Momento Estudio reunimos las fotografías de tus invitados y del fotógrafo profesional para convertir cada instante en un recuerdo compartido. Proyecta fotografías y mensajes durante tu celebración y conserva todos los momentos en un álbum digital privado.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/contacto" className="btn-primary">Cotiza tu evento</Link>
            <Link href="/como-funciona" className="btn-quiet">Conoce cómo funciona</Link>
          </div>
        </div>
      </section>

      {/* El momento más característico: muchas miradas sobre la misma celebración */}
      <Frames
        labels={["Fotografía demostrativa: ceremonia", "Fotografía demostrativa: mesa de invitados", "Fotografía demostrativa: pantalla del evento", "Fotografía demostrativa: pista de baile", "Fotografía demostrativa: estación iPad"]}
        className="mt-16 grid h-[70vh] min-h-[420px] grid-cols-6 grid-rows-2 gap-1.5 px-1.5 md:mt-24 [&>*:nth-child(1)]:col-span-3 [&>*:nth-child(1)]:row-span-2 [&>*:nth-child(2)]:col-span-3 [&>*:nth-child(3)]:col-span-1 [&>*:nth-child(4)]:col-span-1 [&>*:nth-child(5)]:col-span-1"
      />

      <section className="mx-auto mt-32 max-w-6xl px-6">
        <h2 className="text-[40px] md:text-[56px]">Cómo funciona</h2>
        <ol className="mt-12 grid gap-12 md:grid-cols-4 md:gap-8">
          {steps.map((s, i) => (
            <li key={s.title}>
              <span className="font-serif text-[22px] text-champagne">{i + 1}</span>
              <h3 className="mt-3 text-[26px] leading-tight">{s.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-carbon/75">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {services.map((s, i) => (
        <section key={s.id} className={`mx-auto mt-32 grid max-w-6xl items-center gap-10 px-6 md:grid-cols-2 md:gap-20 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
          <Frames labels={[`Fotografía demostrativa: ${s.title.toLowerCase()}`]} className="aspect-[4/5] [&>*]:h-full" />
          <div>
            <h2 className="text-[40px] leading-tight md:text-[52px]">{s.title}</h2>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-carbon/80">{s.body}</p>
          </div>
        </section>
      ))}

      <section className="mx-auto mt-32 max-w-3xl px-6">
        <h2 className="text-[40px] md:text-[52px]">Preguntas frecuentes</h2>
        <div className="mt-8 divide-y divide-carbon/10 border-y border-carbon/10">
          {faqs.slice(0, 5).map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="cursor-pointer list-none text-[18px] marker:hidden">{f.q}</summary>
              <p className="mt-3 text-[16px] leading-relaxed text-carbon/75">{f.a}</p>
            </details>
          ))}
        </div>
        <Link href="/preguntas" className="mt-6 inline-block text-[15px] underline underline-offset-4">Ver todas las preguntas</Link>
      </section>

      <section id="cotizar" className="mx-auto mt-32 max-w-3xl px-6">
        <h2 className="text-[40px] md:text-[52px]">Cotiza tu evento</h2>
        <p className="mt-4 text-[17px] text-carbon/75">Cuéntanos sobre tu celebración y te enviamos una propuesta a medida.</p>
        <div className="mt-10"><QuoteForm /></div>
      </section>
    </main>
  );
}
