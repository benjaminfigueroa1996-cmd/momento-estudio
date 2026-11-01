import { db, getEventBySlug, albumOpen } from "@/lib/db";
import { signGet } from "@/lib/r2";
import { fail } from "@/lib/guard";

// Descarga del original desde el álbum: solo si la foto está en el álbum aprobado
export async function GET(_: Request, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const ev = await getEventBySlug(slug);
  if (!ev || !albumOpen(ev) || !ev.guest_downloads) return fail("Descarga no disponible.", 403);
  const { data } = await db().from("album_items").select("original_key").eq("event_id", ev.id).eq("id", id).maybeSingle();
  const row = data as { original_key: string } | null;
  if (!row) return fail("Foto no encontrada.", 404);
  const ext = row.original_key.split(".").pop();
  const url = await signGet(row.original_key, { download: `momento-estudio-${id.slice(0, 8)}.${ext}`, seconds: 300 });
  return Response.redirect(url, 302);
}
