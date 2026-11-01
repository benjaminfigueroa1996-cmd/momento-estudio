import QRCode from "qrcode";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db, type EventRow } from "@/lib/db";
import { env } from "@/lib/env";

// Tarjeta para mesas: 10 × 15 cm, lista para imprimir desde el navegador
export default async function Card({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { data } = await db().from("events").select("*").eq("id", (await params).id).maybeSingle();
  if (!data) notFound();
  const ev = data as EventRow;
  const svg = await QRCode.toString(`${env.siteUrl()}/e/${ev.slug}`, { type: "svg", margin: 0, color: { dark: "#242321", light: "#00000000" } });
  return (
    <main className="flex min-h-dvh items-center justify-center bg-beige print:bg-white">
      <style>{`@page { size: 100mm 150mm; margin: 0 } @media print { nav { display: none } }`}</style>
      <article className="flex h-[150mm] w-[100mm] flex-col items-center bg-blanco px-[10mm] py-[12mm] text-center shadow-xl print:shadow-none">
        <p className="text-[9pt] text-piedra">Momento Estudio</p>
        <h1 className="mt-[5mm] text-[22pt] leading-tight">{ev.hosts_names}</h1>
        <p className="mt-[3mm] text-[10pt] leading-snug">Comparte tus fotos de hoy en la pantalla y en nuestro álbum</p>
        <div className="mt-[7mm] w-[52mm]" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mt-auto text-[8.5pt] leading-snug text-piedra">Abre la cámara de tu teléfono y apunta al código. No necesitas descargar nada.</p>
      </article>
    </main>
  );
}
