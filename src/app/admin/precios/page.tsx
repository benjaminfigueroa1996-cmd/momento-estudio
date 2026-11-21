import { requireAdmin } from "@/lib/admin";
import { savePricing } from "@/lib/actions";
import { getPricing } from "@/lib/pricing-server";
import { calcularCotizacion, formatCLP, type PricingConfig } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export default async function Precios() {
  await requireAdmin();
  const c = await getPricing();
  const campo = (k: keyof PricingConfig, label: string, ayuda?: string) => (
    <label className="block"><span className="label">{label}</span>
      <input name={k} inputMode="numeric" className="field" defaultValue={Array.isArray(c[k]) ? (c[k] as number[]).join(", ") : String(c[k])} />
      {ayuda && <span className="mt-1 block text-[12px] text-piedra">{ayuda}</span>}
    </label>
  );
  const ejemplo = calcularCotizacion(c, { paquete: "completo", invitados: 120 });
  const grupo = (titulo: string, hijos: React.ReactNode) => (
    <fieldset className="rounded-3xl bg-blanco p-6"><legend className="px-2 font-serif text-[22px]">{titulo}</legend><div className="mt-2 grid gap-4 sm:grid-cols-2">{hijos}</div></fieldset>
  );
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-[44px]">Precios</h1>
      <p className="mt-3 text-[15px] text-carbon/75">Montos en pesos, sin IVA. Los cambios se aplican de inmediato en el cotizador del sitio. Las cotizaciones ya enviadas no cambian.</p>
      <p className="mt-2 text-[14px] text-piedra">Ejemplo: paquete completo para 120 invitados = {formatCLP(ejemplo.neto)} + IVA ({formatCLP(ejemplo.total)} total).</p>
      <form action={savePricing} className="mt-8 space-y-6">
        {grupo("Paquetes", <>
          {campo("completo", "Paquete completo", "Plataforma + estación iPad + fotógrafo + ayudante")}
          {campo("plataforma", "Solo plataforma", "Sin traslado ni personal")}
          {campo("horasFotografo", "Horas de fotógrafo incluidas")}
          {campo("traslado", "Traslado", "Se suma siempre en el paquete completo")}
        </>)}
        {grupo("Extras", <>
          {campo("segundoFotografo", "Segundo fotógrafo")}
          {campo("segundoIpad", "Segunda estación iPad")}
          {campo("horaExtra", "Hora adicional (fotógrafo + ayudante)")}
          {campo("horaExtraSegundo", "Hora adicional del segundo fotógrafo")}
        </>)}
        {grupo("Invitados", <>
          {campo("invitadosBase", "Sin recargo hasta (invitados)")}
          {campo("recargoMedio", `Recargo de ${c.invitadosBase + 1} a ${c.invitadosMedio}`)}
          {campo("invitadosMedio", "Tramo medio hasta (invitados)")}
          {campo("recargoAlto", `Recargo sobre ${c.invitadosMedio}`)}
        </>)}
        {grupo("Temporada alta (no se muestra al cliente)", <>
          {campo("temporadaPct", "Recargo (%)", "Se suma dentro de cada línea, sin aparecer como recargo")}
          {campo("temporadaMeses", "Meses", "Números separados por coma: 1 = enero … 12 = diciembre")}
          {campo("temporadaDias", "Días", `0 = domingo … 6 = sábado. Hoy: ${c.temporadaDias.map((d) => DIAS[d]).join(", ")}`)}
        </>)}
        {grupo("Condiciones", <>
          {campo("ivaPct", "IVA (%)")}
          {campo("vigenciaDias", "Vigencia de la cotización (días)")}
          {campo("reservaPct", "Reserva (% del total)")}
        </>)}
        <button className="btn-primary">Guardar precios</button>
      </form>
    </main>
  );
}
