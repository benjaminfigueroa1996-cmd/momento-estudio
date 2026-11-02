import Link from "next/link";
import Photo from "@/components/site/Photo";
import Reveal from "@/components/site/Reveal";
import QuoteForm from "@/components/site/QuoteForm";
import { steps, faqs } from "@/content/site";

// Fotos en public/fotos/01.jpg … 18.jpg — ver docs/fotos-del-sitio.md (qué va en cada una, créditos y licencias)
const Eyebrow = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => (
  <p className={`text-[12px] uppercase tracking-[0.32em] ${light ? "text-champagne" : "text-champagne"}`}>{children}</p>
);

function Polaroid({ n, alt, caption, rotate, className = "" }: { n: number; alt: string; caption?: string; rotate: number; className?: string }) {
  return (
    <figure className={`bg-[#FBF8F2] p-3 pb-0 shadow-[0_18px_40px_rgba(0,0,0,0.22)] transition-transform duration-500 ease-suave hover:rotate-0 hover:scale-[1.03] ${className}`} style={{ transform: `rotate(${rotate}deg)` }}>
      <Photo n={n} alt={alt} sizes="(max-width: 768px) 50vw, 22vw" className="aspect-[4/5]" />
      <figcaption className="flex h-16 items-center justify-center px-2 text-center font-hand text-[22px] leading-none text-[#2b2a27]">{caption}</figcaption>
    </figure>
  );
}

export default function Home() {
  return (
    <main className="overflow-x-clip">
      {/* Portada */}
      <section className="relative h-[calc(100dvh-3.5rem)] min-h-[600px] w-full">
        <Photo n={1} alt="Invitados de un matrimonio sacándose una selfie en la fiesta" priority sizes="100vw" className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-carbon/85 via-carbon/30 to-carbon/5" />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-16 text-blanco md:pb-24">
          <Eyebrow light>Momento Estudio</Eyebrow>
          <h1 className="mt-5 max-w-4xl text-[46px] leading-[1.02] md:text-[92px]">Los recuerdos de tu evento, desde todos los ángulos.</h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-blanco/80 md:text-[19px]">Fotos y mensajes de tus invitados en una pantalla en vivo, un álbum compartido y un archivo privado para siempre.</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/contacto" className="btn bg-blanco text-carbon hover:bg-marfil">Cotiza tu evento</Link>
            <Link href="/como-funciona" className="btn border border-blanco/40 text-blanco hover:border-blanco">Conoce cómo funciona</Link>
          </div>
        </div>
      </section>

      {/* Declaración */}
      <section className="mx-auto max-w-4xl px-6 py-28 text-center md:py-36">
        <Reveal>
          <p className="font-serif text-[30px] leading-[1.25] md:text-[46px]">
            Cada invitado ve la fiesta desde un lugar distinto. Nosotros reunimos todas esas miradas en un solo recuerdo.
          </p>
        </Reveal>
      </section>

      {/* Matrimonios */}
      <section id="matrimonios" className="mx-auto max-w-6xl px-6 pb-28 md:pb-36">
        <div className="grid items-end gap-10 md:grid-cols-[1fr_1.1fr] md:gap-16">
          <Reveal>
            <Eyebrow>Matrimonios</Eyebrow>
            <h2 className="mt-4 text-[44px] leading-[1.04] md:text-[64px]">El día más importante, contado por todos.</h2>
            <p className="mt-6 max-w-md text-[18px] leading-relaxed text-carbon/70">Del brindis a la pista de baile, las fotos de tus invitados llegan a la pantalla con sus dedicatorias y quedan guardadas para ustedes.</p>
          </Reveal>
          <Reveal delay={120}>
            <Photo n={2} alt="Novios celebrando junto a sus invitados" sizes="(max-width: 768px) 100vw, 55vw" className="aspect-[4/5] rounded-3xl md:aspect-[5/6]" />
          </Reveal>
        </div>
        <div className="mt-5 grid grid-cols-12 gap-5">
          <Reveal className="col-span-12 md:col-span-7"><Photo n={3} alt="Invitados brindando con copas" sizes="(max-width: 768px) 100vw, 60vw" className="aspect-[16/10] rounded-3xl" /></Reveal>
          <Reveal delay={120} className="col-span-12 md:col-span-5"><Photo n={4} alt="Pareja bailando en la fiesta" sizes="(max-width: 768px) 100vw, 40vw" className="aspect-[16/10] rounded-3xl md:aspect-auto md:h-full" /></Reveal>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="border-y border-carbon/10 bg-blanco">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-24 md:grid-cols-[0.9fr_1.1fr] md:py-32">
          <Reveal className="grid grid-cols-2 gap-4 self-start">
            <Photo n={5} alt="Invitada escaneando el código QR con su teléfono" sizes="(max-width: 768px) 50vw, 22vw" className="aspect-[3/4] rounded-2xl" />
            <Photo n={6} alt="Amigas compartiendo fotos desde sus teléfonos" sizes="(max-width: 768px) 50vw, 22vw" className="mt-14 aspect-[3/4] rounded-2xl" />
          </Reveal>
          <div>
            <Reveal><Eyebrow>Cómo funciona</Eyebrow><h2 className="mt-4 text-[40px] leading-[1.05] md:text-[56px]">Un código, cero aplicaciones.</h2></Reveal>
            <div className="mt-10 space-y-8">
              {steps.map((s, i) => (
                <Reveal key={s.title} delay={i * 100}>
                  <div className="grid grid-cols-[48px_1fr] gap-4">
                    <span className="font-serif text-[40px] leading-none text-champagne">{i + 1}</span>
                    <div><h3 className="text-[22px] leading-tight">{s.title}</h3><p className="mt-2 text-[15px] leading-relaxed text-carbon/70">{s.body}</p></div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pantalla en vivo: muro de polaroids */}
      <section className="bg-carbon text-marfil">
        <div className="mx-auto max-w-6xl px-6 pt-24 md:pt-32">
          <Reveal className="max-w-2xl">
            <Eyebrow light>Pantalla en vivo</Eyebrow>
            <h2 className="mt-4 text-[44px] leading-[1.05] md:text-[68px]">Un muro de recuerdos que se arma durante la fiesta.</h2>
            <p className="mt-6 text-[18px] leading-relaxed text-marfil/70">Cada foto llega como una instantánea recién revelada, con el mensaje escrito por quien la tomó. Cada recuerdo aparece una vez y da paso al siguiente.</p>
          </Reveal>
        </div>
        <Reveal delay={120} className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            <Polaroid n={14} alt="Novia riendo con sus amigas" caption="¡Que viva el amor!" rotate={-4} />
            <Polaroid n={15} alt="Brindis entre amigos" caption="Los queremos mucho" rotate={3} className="md:mt-10" />
            <Polaroid n={16} alt="Abrazo en la pista de baile" rotate={-2} />
            <Polaroid n={17} alt="Selfie de un grupo de invitados" caption="Por muchos años de felicidad" rotate={4} className="md:mt-8" />
          </div>
        </Reveal>
        <div className="mx-auto max-w-6xl px-6 pb-24 md:pb-32">
          <Reveal><Photo n={7} alt="Invitados mirando la pantalla con sus fotos durante el evento" sizes="(max-width: 1200px) 100vw, 1150px" className="aspect-[21/9] rounded-3xl" /></Reveal>
        </div>
      </section>

      {/* Eventos corporativos */}
      <section id="corporativos" className="mx-auto max-w-6xl px-6 py-28 md:py-36">
        <div className="grid gap-5 md:grid-cols-12">
          <Reveal className="md:col-span-5 md:pr-6">
            <Eyebrow>Eventos corporativos</Eyebrow>
            <h2 className="mt-4 text-[40px] leading-[1.05] md:text-[56px]">Tu equipo, en el centro de la marca.</h2>
            <p className="mt-6 text-[17px] leading-relaxed text-carbon/70">Lanzamientos, aniversarios y celebraciones de fin de año. Las fotos de los asistentes en pantalla, con el logo de tu empresa, y un archivo listo para comunicaciones internas.</p>
            <Photo n={10} alt="Colegas conversando y brindando en un cóctel" sizes="(max-width: 768px) 100vw, 35vw" className="mt-10 aspect-[4/5] rounded-3xl" />
          </Reveal>
          <div className="grid gap-5 md:col-span-7">
            <Reveal delay={120}><Photo n={8} alt="Cóctel corporativo con asistentes conversando" sizes="(max-width: 768px) 100vw, 55vw" className="aspect-[4/3] rounded-3xl" /></Reveal>
            <Reveal delay={200}><Photo n={9} alt="Foto grupal de un equipo de trabajo en un evento" sizes="(max-width: 768px) 100vw, 55vw" className="aspect-[16/9] rounded-3xl" /></Reveal>
          </div>
        </div>
      </section>

      {/* Fiestas y celebraciones */}
      <section id="fiestas" className="bg-[#1b1a18] text-marfil">
        <Reveal><Photo n={11} alt="Público disfrutando de un concierto con luces cálidas" sizes="100vw" className="aspect-[16/9] w-full md:aspect-[21/8]" /></Reveal>
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-24 md:grid-cols-[1.1fr_1fr] md:gap-16 md:py-32">
          <Reveal>
            <Eyebrow light>Fiestas, conciertos y cumpleaños</Eyebrow>
            <h2 className="mt-4 text-[40px] leading-[1.05] md:text-[60px]">Toda la energía de la noche, en una sola pantalla.</h2>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-marfil/70">Selfies, brindis y momentos que nadie más vio. Tus invitados los comparten al instante y la fiesta se ve a sí misma.</p>
          </Reveal>
          <Reveal delay={120} className="grid grid-cols-2 gap-4">
            <Photo n={12} alt="Amigos sacándose una selfie de noche" sizes="(max-width: 768px) 50vw, 25vw" className="aspect-[3/4] rounded-2xl" />
            <Photo n={13} alt="Brindis en una celebración de cumpleaños" sizes="(max-width: 768px) 50vw, 25vw" className="mt-12 aspect-[3/4] rounded-2xl" />
          </Reveal>
        </div>
      </section>

      {/* Estación iPad y archivo privado */}
      <section className="mx-auto grid max-w-6xl gap-5 px-6 py-28 md:grid-cols-2 md:py-36">
        <Reveal className="flex flex-col overflow-hidden rounded-3xl bg-blanco">
          <div className="p-10 pb-0">
            <Eyebrow>Estación iPad</Eyebrow>
            <h3 className="mt-4 text-[34px] leading-tight">Una dedicatoria escrita a mano.</h3>
            <p className="mt-4 text-[16px] leading-relaxed text-carbon/70">Con Apple Pencil, los invitados escriben y dibujan sobre las fotos. El original siempre se conserva.</p>
          </div>
          <Photo n={18} alt="Invitada escribiendo una dedicatoria con Apple Pencil" sizes="(max-width: 768px) 100vw, 45vw" className="mt-10 aspect-[4/3]" />
        </Reveal>
        <Reveal delay={120} className="flex flex-col justify-between rounded-3xl bg-carbon p-10 text-marfil">
          <div>
            <Eyebrow light>Archivo privado</Eyebrow>
            <h3 className="mt-4 text-[34px] leading-tight">Todo queda para ustedes.</h3>
            <p className="mt-4 text-[16px] leading-relaxed text-marfil/70">Cada foto y cada mensaje, incluso los que solo pasaron por la pantalla, ordenados y listos para descargar.</p>
          </div>
          <ul className="mt-10 space-y-3 border-t border-marfil/15 pt-8 text-[15px] text-marfil/80">
            <li>Fotos de los invitados y del fotógrafo oficial</li>
            <li>Mensajes y dedicatorias</li>
            <li>Fotos intervenidas en el iPad</li>
            <li>Descarga completa en un archivo ZIP</li>
          </ul>
        </Reveal>
      </section>

      {/* Preguntas */}
      <section className="mx-auto max-w-3xl px-6 pb-28">
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
            <p className="mt-6 max-w-sm text-[18px] leading-relaxed text-marfil/70">Matrimonios, eventos corporativos, cumpleaños y fiestas. Cuéntanos sobre tu celebración y te enviamos una propuesta a medida.</p>
          </Reveal>
          <Reveal delay={120} className="rounded-3xl bg-marfil p-6 text-carbon md:p-10"><QuoteForm /></Reveal>
        </div>
      </section>
    </main>
  );
}
