import { z } from "zod";
import { db } from "@/lib/db";
import { createUploads } from "@/lib/media";
import { fileRequestSchema } from "@/lib/schemas";
import { photographerFromToken } from "@/lib/photographer";
import { json, fail, rateLimit } from "@/lib/guard";

const body = z.object({ files: z.array(fileRequestSchema.required({ sha256: true, name: true })).min(1).max(50) });

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await rateLimit("photo-up", 600, 60))) return fail("Demasiadas solicitudes. Espera un momento.", 429);
  const p = await photographerFromToken(token);
  if (!p) return fail("Enlace de carga no válido o revocado.", 401);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Solo se aceptan fotos JPG, PNG, WebP o HEIC.");
  try {
    const { tickets, duplicates } = await createUploads(p.event, "photographer", parsed.data.files, { photographerLinkId: p.linkId });
    if (duplicates.length) {
      await db().from("photographer_uploads").insert(duplicates.map((filename) => ({ link_id: p.linkId, filename, status: "duplicate" })));
    }
    return json({ tickets, duplicates });
  } catch (e) {
    return fail((e as Error).message);
  }
}
