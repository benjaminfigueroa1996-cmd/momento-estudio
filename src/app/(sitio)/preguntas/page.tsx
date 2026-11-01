import { faqs } from "@/content/site";

export const metadata = { title: "Preguntas frecuentes" };

export default function Faq() {
  return (
    <main className="mx-auto max-w-3xl px-6 pt-12">
      <h1 className="text-[52px] leading-tight md:text-[72px]">Preguntas frecuentes</h1>
      <div className="mt-12 divide-y divide-carbon/10 border-y border-carbon/10">
        {faqs.map((f) => (
          <details key={f.q} className="py-6">
            <summary className="cursor-pointer list-none text-[19px]">{f.q}</summary>
            <p className="mt-3 text-[16px] leading-relaxed text-carbon/75">{f.a}</p>
          </details>
        ))}
      </div>
    </main>
  );
}
