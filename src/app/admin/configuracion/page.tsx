import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { saveSettings } from "@/lib/actions";

export default async function Settings() {
  await requireAdmin();
  const { data } = await db().from("settings").select("key, value");
  const v = Object.fromEntries(((data ?? []) as { key: string; value: string }[]).map((r) => [r.key, r.value]));
  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-[44px]">Datos de contacto</h1>
      <p className="mt-3 text-[15px] text-carbon/75">Se muestran en el sitio público. Lo que dejes vacío no aparece.</p>
      <form action={saveSettings} className="mt-8 space-y-4">
        <label className="block"><span className="label">Correo comercial</span><input name="contact_email" type="email" className="field" defaultValue={v.contact_email} /></label>
        <label className="block"><span className="label">Teléfono o WhatsApp</span><input name="contact_phone" className="field" defaultValue={v.contact_phone} /></label>
        <label className="block"><span className="label">Instagram (usuario)</span><input name="contact_instagram" className="field" defaultValue={v.contact_instagram} /></label>
        <button className="btn-primary">Guardar</button>
      </form>
    </main>
  );
}
