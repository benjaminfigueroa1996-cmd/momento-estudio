import QuoteForm from "@/components/site/QuoteForm";

export const metadata = { title: "Cotiza tu evento" };

export default function Contact() {
  return (
    <main className="mx-auto max-w-3xl px-6 pt-12">
      <h1 className="text-[52px] leading-tight md:text-[72px]">Cotiza tu evento</h1>
      <p className="mt-6 max-w-xl text-[18px] text-carbon/80">Cuéntanos sobre tu celebración. Te responderemos con una propuesta a medida.</p>
      <div className="mt-12"><QuoteForm /></div>
    </main>
  );
}
