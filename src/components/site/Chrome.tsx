import Link from "next/link";
import { db } from "@/lib/db";

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <Link href="/" className="font-serif text-[26px] leading-none">Momento Estudio</Link>
      <nav className="hidden items-center gap-8 text-[14px] text-carbon/75 md:flex">
        <Link href="/como-funciona" className="hover:text-carbon">Cómo funciona</Link>
        <Link href="/servicios" className="hover:text-carbon">Servicios</Link>
        <Link href="/preguntas" className="hover:text-carbon">Preguntas</Link>
        <Link href="/contacto" className="btn-primary min-h-[42px] px-5 text-[14px]">Cotiza tu evento</Link>
      </nav>
      <Link href="/contacto" className="btn-primary min-h-[42px] px-5 text-[14px] md:hidden">Cotizar</Link>
    </header>
  );
}

export async function SiteFooter() {
  let contact: Record<string, string> = {};
  try {
    const { data } = await db().from("settings").select("key, value");
    contact = Object.fromEntries(((data ?? []) as { key: string; value: string }[]).map((r) => [r.key, r.value]));
  } catch { /* sin base configurada: el pie se muestra sin datos */ }
  return (
    <footer className="mt-32 border-t border-carbon/10">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 text-[14px] md:grid-cols-3">
        <div><p className="font-serif text-[24px]">Momento Estudio</p><p className="mt-2 text-piedra">Cada momento cuenta.</p></div>
        <div className="space-y-1 text-carbon/75">
          {contact.contact_email && <p><a href={`mailto:${contact.contact_email}`}>{contact.contact_email}</a></p>}
          {contact.contact_phone && <p>{contact.contact_phone}</p>}
          {contact.contact_instagram && <p><a href={`https://instagram.com/${contact.contact_instagram.replace(/^@/, "")}`}>@{contact.contact_instagram.replace(/^@/, "")}</a></p>}
          <p><Link href="/contacto">Solicitar cotización</Link></p>
        </div>
        <div className="space-y-1 text-carbon/75"><p><Link href="/privacidad">Privacidad</Link></p><p><Link href="/terminos">Términos y condiciones</Link></p></div>
      </div>
    </footer>
  );
}
