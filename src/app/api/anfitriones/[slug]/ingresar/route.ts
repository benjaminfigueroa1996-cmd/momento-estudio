import { z } from "zod";
import { db, getEventBySlug, audit } from "@/lib/db";
import { verifySecret } from "@/lib/crypto";
import { startHostSession } from "@/lib/session";
import { rateLimit, json, fail } from "@/lib/guard";

const body = z.object({ code: z.string().trim().min(8).max(32) });

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // 5 intentos cada 15 minutos por conexión y evento
  if (!(await rateLimit(`host:${slug}`, 5, 900))) return fail("Demasiados intentos. Espera 15 minutos.", 429);
  const ev = await getEventBySlug(slug);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!ev || !parsed.success) return fail("Código incorrecto.", 401);
  if (ev.host_access_until && new Date(ev.host_access_until) < new Date()) return fail("El acceso privado de este evento expiró.", 403);

  const code = parsed.data.code.toUpperCase().replace(/[\s-]/g, "");
  const { data } = await db().from("couple_access").select("id, code_hash, expires_at").eq("event_id", ev.id).is("revoked_at", null);
  for (const a of (data ?? []) as { id: string; code_hash: string; expires_at: string | null }[]) {
    if (a.expires_at && new Date(a.expires_at) < new Date()) continue;
    if (await verifySecret(code, a.code_hash)) {
      await startHostSession(ev.id, a.id);
      await audit(ev.id, "host", a.id, "host.login");
      return json({ ok: true });
    }
  }
  await audit(ev.id, "host", null, "host.login_failed");
  return fail("Código incorrecto.", 401);
}
