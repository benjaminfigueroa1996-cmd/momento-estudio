import Link from "next/link";
import Reveal from "@/components/site/Reveal";
import QuoteForm from "@/components/site/QuoteForm";
import DemoWall from "@/components/site/DemoWall";
import PhoneMock from "@/components/site/PhoneMock";
import { steps, faqs } from "@/content/site";

// Portada centrada en el producto: el muro en pantalla, el teléfono del invitado y el iPad.
// Las ilustraciones usan luces de fiesta abstractas; cuando existan fotos reales de eventos se suman en public/fotos.
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[12px] uppercase tracking-[0.32em] text-champagne">{children}</p>
);

export default function Home() {
  return (
    <main className="overflow-x-clip">
      {/* Portada: el muro en movimiento */}
      <section className="relative bg-carbon text-marfil">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_120%,rgba(183,154,112,0.28),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-16 md:grid-cols-[0.9fr_1.1fr] md:pb-28 md:pt-24">
          <div>
            <Eyebrow>Fotos y mensajes en vivo para eventos</Eyebrow>
            <h1 className="mt-5 text-[46px] leading-[1.02] md:text-[76px]">Los recuerdos de tu evento, desde todos los ángulos.</h1>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-marfil/75">Tus invitados escanean un código, comparten sus fotos y dedicatorias, y aparecen al instante en la pantalla de la fiesta. Después, todo queda guardado para ustedes.</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/contacto" className="btn bg-blanco text-carbon hover:bg-marfil">Cotiza tu evento</Link>
              <Link href="#como-funciona" className="btn border border-marfil/30 text-marfil hover:border-marfil">Cómo funciona</Link>
            </div>
          </div>
          <Reveal>
            <DemoWall className="aspect-[16/10]" />
            <p className="mt-4 text-center text-[12px] text-marfil/45">Así se ve la pantalla durante la fiesta</p>
          </Reveal>
        </div>
      </section>

      {/* Declaración */}
      <section className="mx-auto max-w-4xl px-6 py-28 text-center md:py-36">
        <Reveal>
          <p className="font-serif text-[30px] leading-[1.25] md:text-[46px]">Cada invitado vive la fiesta desde un lugar distinto. Nosotros reunimos todas esas miradas en un solo recuerdo.</p>
        </Reveal>
      </section>

      {/* Cómo funciona: el teléfono */}
      <section id="como-funciona" className="border-y border-carbon/10 bg-blanco">
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 py-24 md:grid-cols-[0.8fr_1.2fr] md:py-32">
          <Reveal><PhoneMock /></Reveal>
          <div>
            <Reveal><Eyebrow>Cómo funciona</Eyebrow><h2 className="mt-4 text-[40px] leading-[1.05] md:text-[56px]">Un código. Cero aplicaciones.</h2></Reveal>
            <div className="mt-10 space-y-8">
              {steps.map((s, i) => (
                <Reveal key={s.title} delay={i * 90}>
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

      {/* Pantalla en vivo: características */}
      <section className="bg-carbon text-marfil">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <Reveal className="max-w-2xl">
            <Eyebrow>Pantalla en vivo</Eyebrow>
            <h2 className="mt-4 text-[44px] leading-[1.05] md:text-[64px]">Un muro de recuerdos que se arma durante la fiesta.</h2>
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              ["Fotos instantáneas", "Cada foto llega como una polaroid recién revelada, con la dedicatoria escrita a mano en el marco."],
              ["Mensajes como en un chat", "Los saludos sin foto aparecen como conversación, con avatares que se alternan de lado."],
              ["Cada recuerdo, una vez", "Las fotos suben lentamente y dan paso a las nuevas. Nada se repite ni se acumula."],
            ].map(([t, b], i) => (
              <Reveal key={t} delay={i * 100} className="rounded-3xl border border-marfil/10 bg-white/[0.03] p-8">
                <h3 className="text-[24px] leading-tight">{t}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-marfil/65">{b}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-5 grid gap-5 md:grid-cols-[1.4fr_1fr]">
            <div className="rounded-3xl border border-marfil/10 bg-white/[0.03] p-8">
              <h3 className="text-[24px] leading-tight">Se adapta a cualquier pantalla</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-marfil/65">Proyector, televisor vertical o pantalla panorámica: el muro cambia sus columnas solo. El código QR queda siempre visible para que nadie se quede fuera.</p>
              <div className="mt-8 flex items-end gap-4" aria-hidden>
                <span className="h-16 w-28 rounded-md border-2 border-marfil/40" />
                <span className="h-24 w-14 rounded-md border-2 border-marfil/40" />
                <span className="h-16 w-16 rounded-md border-2 border-marfil/40" />
                <span className="h-12 w-40 rounded-md border-2 border-marfil/40" />
              </div>
            </div>
            <div className="rounded-3xl bg-marfil p-8 text-carbon">
              <h3 className="text-[24px] leading-tight">Ustedes deciden qué se ve</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-carbon/70">Aprueban antes de mostrar, retiran lo que no corresponde y destacan sus favoritas desde el teléfono.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Para cada evento */}
      <section id="eventos" className="mx-auto max-w-6xl px-6 py-28 md:py-36">
        <Reveal><Eyebrow>Para cada celebración</Eyebrow><h2 className="mt-4 max-w-3xl text-[40px] leading-[1.05] md:text-[56px]">Matrimonios, empresas y fiestas.</h2></Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          <Reveal className="flex flex-col overflow-hidden rounded-3xl bg-blanco">
            <div className="relative h-56 overflow-hidden bg-carbon">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_40%_120%,rgba(183,154,112,0.4),transparent_65%)]" />
              {[["luz-1", "-6deg", "12%", "22%"], ["luz-4", "4deg", "40%", "14%"], ["luz-6", "-2deg", "66%", "26%"]].map(([img, r, l, t]) => (
                <figure key={img} className="absolute w-[30%] bg-[#FBF8F2] p-[2%] pb-[7%] shadow-xl" style={{ left: l, top: t, transform: `rotate(${r})` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/ilustraciones/${img}.jpg`} alt="" className="aspect-[4/5] w-full object-cover" />
                </figure>
              ))}
            </div>
            <div className="p-8">
              <h3 className="text-[28px] leading-tight">Matrimonios</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-carbon/70">Del brindis a la pista de baile, las dedicatorias de los invitados en pantalla y un archivo privado para los novios.</p>
            </div>
          </Reveal>
          <Reveal delay={100} className="flex flex-col overflow-hidden rounded-3xl bg-blanco">
            <div className="relative flex h-56 items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#0e203a,#1c4e8c)]">
              <div className="w-[70%] rounded-lg border-4 border-[#0a0a0a] bg-[linear-gradient(135deg,#123059,#2a6aad)] p-3 shadow-2xl">
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-wide text-white"><span className="rounded bg-white px-1 text-[#123059]">E</span>EMPRESA</div>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {["luz-3", "luz-5", "luz-8"].map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={img} src={`/ilustraciones/${img}.jpg`} alt="" className="aspect-square w-full border-2 border-[#FBF8F2] object-cover" />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-[28px] leading-tight">Eventos corporativos</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-carbon/70">Con el logo y el fondo de tu marca. Lanzamientos, aniversarios y fiestas de fin de año, con un archivo listo para comunicaciones internas.</p>
            </div>
          </Reveal>
          <Reveal delay={200} className="flex flex-col overflow-hidden rounded-3xl bg-blanco">
            <div className="relative h-56 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ilustraciones/luz-5.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-x-6 bottom-6 space-y-2">
                <p className="ml-auto w-fit rounded-2xl rounded-br-sm bg-[#EFE4D2] px-3 py-2 text-[13px] text-carbon shadow-lg">¡Feliz cumpleaños, Sofi! 🎉</p>
                <p className="w-fit rounded-2xl rounded-bl-sm bg-blanco px-3 py-2 text-[13px] text-carbon shadow-lg">¡Qué noche! 🥂</p>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-[28px] leading-tight">Fiestas y cumpleaños</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-carbon/70">Selfies, brindis y saludos que llegan a la pantalla al instante. La fiesta se ve a sí misma.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Estación iPad y archivo privado */}
      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-28 md:grid-cols-2 md:pb-36">
        <Reveal className="flex flex-col overflow-hidden rounded-3xl bg-blanco">
          <div className="p-10 pb-0">
            <Eyebrow>Estación iPad</Eyebrow>
            <h3 className="mt-4 text-[34px] leading-tight">Una dedicatoria escrita a mano.</h3>
            <p className="mt-4 text-[16px] leading-relaxed text-carbon/70">Con Apple Pencil, los invitados escriben y dibujan sobre las fotos. El original siempre se conserva.</p>
          </div>
          <div className="mt-10 flex justify-center bg-beige/50 px-10 pb-0 pt-10">
            <div className="w-full max-w-[380px] rounded-t-[26px] border-[10px] border-b-0 border-[#141312] bg-[#141312]">
              <div className="relative overflow-hidden rounded-t-[16px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/ilustraciones/luz-2.jpg" alt="" className="aspect-[4/3] w-full object-cover" />
                <p className="absolute bottom-[12%] left-[10%] -rotate-6 font-hand text-[34px] leading-none text-blanco drop-shadow">¡Los queremos!</p>
                <svg viewBox="0 0 100 30" className="absolute right-[10%] top-[14%] w-[26%]" fill="none" stroke="#FFFEFC" strokeWidth="2.2" strokeLinecap="round"><path d="M10 18c6-12 16-12 14 0-2 10-14 6-6-4 6-6 14 2 10 8" /><path d="M58 12c8 2 10 10 4 12s-10-6-2-10 18 2 20 8" /></svg>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={100} className="flex flex-col justify-between rounded-3xl bg-carbon p-10 text-marfil">
          <div>
            <Eyebrow>Archivo privado</Eyebrow>
            <h3 className="mt-4 text-[34px] leading-tight">Todo queda para ustedes.</h3>
            <p className="mt-4 text-[16px] leading-relaxed text-marfil/70">Cada foto y cada mensaje, incluso los que solo pasaron por la pantalla, ordenados y listos para descargar.</p>
          </div>
          <div className="mt-10 grid grid-cols-4 gap-2" aria-hidden>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={n} src={`/ilustraciones/luz-${n}.jpg`} alt="" loading="lazy" className="aspect-square w-full rounded-md object-cover opacity-90" />
            ))}
          </div>
          <ul className="mt-8 space-y-2 border-t border-marfil/15 pt-6 text-[15px] text-marfil/80">
            <li>Fotos de los invitados y del fotógrafo oficial</li>
            <li>Mensajes y dedicatorias</li>
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
            <p className="mt-6 max-w-sm text-[18px] leading-relaxed text-marfil/70">Elige tu experiencia, ve el valor al instante y recibe tu cotización formal en un minuto.</p>
          </Reveal>
          <Reveal delay={100} className="rounded-3xl bg-marfil p-6 text-carbon md:p-10"><QuoteForm /></Reveal>
        </div>
      </section>
    </main>
  );
}
