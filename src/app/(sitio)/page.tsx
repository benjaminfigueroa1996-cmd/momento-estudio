import Link from "next/link";
import Photo from "@/components/site/Photo";
import Reveal from "@/components/site/Reveal";
import QuoteForm from "@/components/site/QuoteForm";
import { steps, faqs } from "@/content/site";

// Fotos: public/demo/01.jpg … 08.jpg (ver docs/fotos-del-sitio.md)
export default function Home() {
  return (
    <main className="overflow-x-clip">
      {/* Portada: una foto a pantalla completa, el mensaje encima */}
      <section className="relative h-[calc(100dvh-3.5rem)] min-h-[560px] w-full">
        <Photo n={1} alt="Novios celebrando con sus invitados" priority className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-carbon/80 via-carbon/25 to-carbon/10" />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-16 text-blanco md:pb-24">
          <p className="text-[12px] uppercase tracking-[0.35em] text-champagne">Momento Estudio</p>
          <h1 className="mt-5 max-w-4xl text-[48px] leading-[1.02] md:text-[92px]">Los recuerdos de tu evento, desde todos los ángulos.</h1>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/contacto" className="btn bg-blanco text-carbon hover:bg-marfil">Cotiza tu evento</Link>
            <Link href="/como-funciona" className="btn border border-blanco/40 text-blanco hover:border-blanco">Conoce cómo funciona</Link>
          </div>
        </div>
      </section>

      {/* Declaración */}
      <section className="mx-auto max-w-4xl px-6 py-28 text-center md:py-40">
        <Reveal>
          <p className="font-serif text-[30px] leading-[1.25] md:text-[46px]">
            Reunimos las fotografías de tus invitados y del fotógrafo profesional para convertir cada instante en un recuerdo compartido.
          </p>
        </Reveal>
      </section>

      {/* Pantalla en vivo */}
      <section className="bg-carbon text-marfil">
        <div className="mx-auto max-w-6xl px-6 pt-24 md:pt-32">
          <Reveal className="max-w-2xl">
            <p className="text-[12px] uppercase tracking-[0.3em] text-champagne">Pantalla en vivo</p>
            <h2 className="mt-4 text-[44px] leading-[1.05] md:text-[68px]">Cada foto llega como un mensaje.</h2>
            <p className="mt-6 text-[18px] leading-relaxed text-marfil/70">Tus invitados escanean el código, eligen una foto, escriben una dedicatoria y la ven aparecer en la pantalla de la fiesta.</p>
          </Reveal>
        </div>
        <Reveal delay={150} className="mx-auto mt-16 max-w-6xl px-6 pb-24 md:pb-32">
          <div className="grid grid-cols-12 gap-3 md:gap-5">
            <Photo n={2} alt="Invitados mirando la pantalla del evento" className="col-span-12 aspect-[16/9] rounded-2xl md:col-span-8" />
            <div className="col-span-12 grid grid-cols-2 gap-3 md:col-span-4 md:grid-cols-1 md:gap-5">
              <Photo n={3} alt="Invitada tomando una foto con su teléfono" className="aspect-square rounded-2xl md:aspect-auto md:h-full" />
              <div className="flex aspect-square flex-col justify-end rounded-2xl bg-marfil p-6 text-carbon md:aspect-auto md:h-full">
                <p className="font-serif text-[24px] leading-snug md:text-[28px]">“Por muchos años de felicidad.”</p>
                <p className="mt-3 text-[12px] text-piedra">Así se ve un mensaje en pantalla</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Álbum compartido */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-28 md:grid-cols-2 md:gap-20 md:py-40">
        <Reveal>
          <p className="text-[12px] uppercase tracking-[0.3em] text-champagne">Álbum compartido</p>
          <h2 className="mt-4 text-[44px] leading-[1.05] md:text-[60px]">Todas las miradas, en un solo álbum.</h2>
          <p className="mt-6 max-w-md text-[18px] leading-relaxed text-carbon/70">Las fotos de los invitados y del fotógrafo oficial, juntas en un álbum que todos pueden ver y descargar.</p>
        </Reveal>
        <Reveal delay={150} className="grid grid-cols-2 gap-3">
          <Photo n={4} alt="Detalle de la ceremonia" className="aspect-[3/4] rounded-2xl" />
          <Photo n={5} alt="Brindis de los invitados" className="mt-12 aspect-[3/4] rounded-2xl" />
        </Reveal>
      </section>

      {/* Foto ancha */}
      <Reveal>
        <Photo n={6} alt="Pista de baile al final de la noche" className="mx-auto aspect-[21/9] w-full max-w-[1600px]" />
      </Reveal>

      {/* Estación iPad y archivo privado */}
      <section className="mx-auto grid max-w-6xl gap-5 px-6 py-28 md:grid-cols-2 md:py-40">
        <Reveal className="flex flex-col overflow-hidden rounded-3xl bg-blanco">
          <div className="p-10 pb-0">
            <p className="text-[12px] uppercase tracking-[0.3em] text-champagne">Estación iPad</p>
            <h3 className="mt-4 text-[34px] leading-tight">Una dedicatoria escrita a mano.</h3>
            <p className="mt-4 text-[16px] leading-relaxed text-carbon/70">Con Apple Pencil, los invitados escriben y dibujan sobre las fotos. El original siempre se conserva.</p>
          </div>
          <Photo n={7} alt="Invitado escribiendo con Apple Pencil" className="mt-10 aspect-[4/3]" />
        </Reveal>
        <Reveal delay={150} className="flex flex-col overflow-hidden rounded-3xl bg-carbon text-marfil">
          <div className="p-10 pb-0">
            <p className="text-[12px] uppercase tracking-[0.3em] text-champagne">Archivo privado</p>
            <h3 className="mt-4 text-[34px] leading-tight">Todo queda para ustedes.</h3>
            <p className="mt-4 text-[16px] leading-relaxed text-marfil/70">Cada foto y cada mensaje, incluso los que solo pasaron por la pantalla, listos para descargar.</p>
          </div>
          <Photo n={8} alt="Novios revisando sus recuerdos" className="mt-10 aspect-[4/3]" />
        </Reveal>
      </section>

      {/* Cómo funciona */}
      <section className="border-y border-carbon/10 bg-blanco">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <Reveal><h2 className="text-[40px] md:text-[56px]">Cómo funciona</h2></Reveal>
          <div className="mt-14 grid gap-12 md:grid-cols-4 md:gap-8">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 120}>
                <div>
                  <span className="font-serif text-[48px] leading-none text-champagne">{i + 1}</span>
                  <h3 className="mt-4 text-[24px] leading-tight">{s.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-carbon/70">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Preguntas */}
      <section className="mx-auto max-w-3xl px-6 py-28">
        <Reveal><h2 className="text-[40px] md:text-[52px]">Preguntas frecuentes</h2></Reveal>
        <div className="mt-10 divide-y divide-carbon/10 border-y border-carbon/10">
          {faqs.slice(0, 5).map((f) => (
            <details key={f.q} className="group py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[18px] marker:hidden">
                {f.q}<span className="text-champagne transition-transform duration-300 group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[16px] leading-relaxed text-carbon/70">{f.a}</p>
            </details>
          ))}
        </div>
        <Link href="/preguntas" className="mt-6 inline-block text-[15px] underline underline-offset-4">Ver todas las preguntas</Link>
      </section>

      {/* Cotización */}
      <section id="cotizar" className="bg-carbon text-marfil">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-28 md:grid-cols-[1fr_1.3fr] md:py-36">
          <Reveal>
            <h2 className="text-[44px] leading-[1.05] md:text-[60px]">Cotiza tu evento</h2>
            <p className="mt-6 max-w-sm text-[18px] leading-relaxed text-marfil/70">Cuéntanos sobre tu celebración y te enviamos una propuesta a medida.</p>
          </Reveal>
          <Reveal delay={150} className="rounded-3xl bg-marfil p-6 text-carbon md:p-10"><QuoteForm /></Reveal>
        </div>
      </section>
    </main>
  );
}
