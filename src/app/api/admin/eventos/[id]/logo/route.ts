import { db, audit } from "@/lib/db";
import { adminEvent } from "@/lib/admin-event";
import { signPut, head, firstBytes, sniffImage } from "@/lib/r2";
import { json, fail } from "@/lib/guard";

// Logo opcional del evento (PNG con fondo transparente o JPEG): 1) URL firmada, 2) subir, 3) confirmar
const keyFor = (id: string) => `events/${id}/logo`;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await adminEvent(id))) return fail("No autorizado.", 401);
  const type = new URL(req.url).searchParams.get("type") === "image/png" ? "image/png" : "image/jpeg";
  const { url } = await signPut(keyFor(id), type, 5 * 1024 * 1024);
  return json({ url, type });
}

export async function PUT(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await adminEvent(id);
  if (!a) return fail("No autorizado.", 401);
  const key = keyFor(id);
  const info = await head(key);
  const bytes = await firstBytes(key);
  const kind = bytes ? sniffImage(bytes) : null;
  if (!info || (kind !== "image/png" && kind !== "image/jpeg")) return fail("El logo debe ser PNG o JPEG.");
  await db().from("events").update({ logo_key: key }).eq("id", id);
  await audit(id, "admin", a.actor, "event.logo_updated");
  return json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await adminEvent(id))) return fail("No autorizado.", 401);
  await db().from("events").update({ logo_key: null }).eq("id", id);
  return json({ ok: true });
}
