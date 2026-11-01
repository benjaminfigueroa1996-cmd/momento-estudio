import { db, audit } from "@/lib/db";
import { json, fail } from "@/lib/guard";

/**
 * Tarea programada (Vercel Cron, cada hora). Idempotente: se puede ejecutar varias veces sin efectos dobles.
 * - Marca como fallidas las cargas que quedaron a medias hace más de 24 h (no borra nada).
 * - Limpia contadores de límite de solicitudes viejos.
 * - Informa eventos cuyo plazo de retención venció. La eliminación definitiva NO es automática:
 *   requiere aprobación del propietario (ver docs/decisiones.md).
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return fail("No autorizado.", 401);
  const dayAgo = new Date(Date.now() - 864e5).toISOString();

  const { data: stale } = await db().from("media").update({ status: "failed" }).eq("status", "uploading").lt("created_at", dayAgo).select("id");
  await db().from("rate_limits").delete().lt("window_start", dayAgo);
  const { data: expired } = await db().from("events").select("id, slug").lt("retention_until", new Date().toISOString());

  for (const e of (expired ?? []) as { id: string; slug: string }[]) {
    await audit(e.id, "system", "cron", "retention.expired_pending_approval");
  }
  return json({ staleUploads: stale?.length ?? 0, retentionExpired: (expired ?? []).length });
}
