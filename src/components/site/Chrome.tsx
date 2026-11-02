import Link from "next/link";
import { db } from "@/lib/db";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-carbon/5 bg-marfil/75 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-serif text-[22px] leading-none">Momento Estudio</Link>
        <nav className="hidden items-center gap-8 text-[13px] text-carbon/70 md:flex">
          <Link href="/como-funciona" className="transition-colors hover:text-carbon">Cómo funciona</Link>
          <Link href="/servicios" className="transition-colors hover:text-carbon">Servicios</Link>
          <Link href="/preguntas" className="transition-colors hover:text-carbon">Preguntas</Link>
          <Link href="/contacto" className="rounded-full bg-carbon px-4 py-1.5 text-[13px] text-blanco transition-colors hover:bg-black">Cotiza tu evento</Link>
        </nav>
        <Link href="/contacto" className="rounded-full bg-carbon px-4 py-1.5 text-[13px] text-blanco md:hidden">Cotizar</Link>
      </div>
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
    <footer className="bg-carbon text-marfil">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 text-[14px] md:grid-cols-3">
        <div><p className="font-serif text-[28px]">Momento Estudio</p><p className="mt-2 text-marfil/60">Cada momento cuenta.</p></div>
        <div className="space-y-1.5 text-marfil/75">
          {contact.contact_email && <p><a href={`mailto:${contact.contact_email}`}>{contact.contact_email}</a></p>}
          {contact.contact_phone && <p>{contact.contact_phone}</p>}
          {contact.contact_instagram && <p><a href={`https://instagram.com/${contact.contact_instagram.replace(/^@/, "")}`}>@{contact.contact_instagram.replace(/^@/, "")}</a></p>}
          <p><Link href="/contacto" className="hover:text-blanco">Solicitar cotización</Link></p>
        </div>
        <div className="space-y-1.5 text-marfil/75"><p><Link href="/privacidad" className="hover:text-blanco">Privacidad</Link></p><p><Link href="/terminos" className="hover:text-blanco">Términos y condiciones</Link></p></div>
      </div>
    </footer>
  );
}
