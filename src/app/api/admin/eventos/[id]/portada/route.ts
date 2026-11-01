import { db, audit } from "@/lib/db";
import { adminEvent } from "@/lib/admin-event";
import { signPut, head, firstBytes, sniffImage } from "@/lib/r2";
import { json, fail } from "@/lib/guard";

// Portada del evento: 1) pedir URL firmada, 2) subir JPEG, 3) confirmar con PUT
const keyFor = (id: string) => `events/${id}/cover.jpg`;

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await adminEvent(id))) return fail("No autorizado.", 401);
  const { url } = await signPut(keyFor(id), "image/jpeg", 15 * 1024 * 1024);
  return json({ url });
}

export async function PUT(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await adminEvent(id);
  if (!a) return fail("No autorizado.", 401);
  const key = keyFor(id);
  const info = await head(key);
  const bytes = await firstBytes(key);
  if (!info || !bytes || sniffImage(bytes) !== "image/jpeg") return fail("La portada debe ser una imagen JPEG.");
  await db().from("events").update({ cover_key: key }).eq("id", id);
  await audit(id, "admin", a.actor, "event.cover_updated");
  return json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await adminEvent(id))) return fail("No autorizado.", 401);
  await db().from("events").update({ cover_key: null }).eq("id", id);
  return json({ ok: true });
}
