import Link from "next/link";

export const metadata = { title: "Administración", robots: { index: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-blanco">
      <nav className="border-b border-carbon/10">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4 text-[14px]">
          <Link href="/admin" className="font-serif text-[22px]">Momento Estudio</Link>
          <Link href="/admin" className="text-carbon/70 hover:text-carbon">Eventos</Link>
          <Link href="/admin/cotizaciones" className="text-carbon/70 hover:text-carbon">Cotizaciones</Link>
          <Link href="/admin/configuracion" className="text-carbon/70 hover:text-carbon">Datos de contacto</Link>
          <Link href="/admin/eventos/nuevo" className="btn-primary ml-auto min-h-[40px] px-5">Crear evento</Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
