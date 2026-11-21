import { z } from "zod";
import { db, audit } from "@/lib/db";
import { adminEvent } from "@/lib/admin-event";
import { signPut, head, firstBytes, sniffImage } from "@/lib/r2";
import { json, fail } from "@/lib/guard";

// Fondo de la pantalla en vivo: estilos predefinidos o una imagen propia (por ejemplo, de una empresa)
const keyFor = (id: string) => `events/${id}/background`;
const body = z.object({
  bg: z.enum(["calido", "carbon", "lino", "imagen"]),
  overlay: z.number().min(0).max(0.85).default(0.45),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await adminEvent(id);
  if (!a) return fail("No autorizado.", 401);
  const url = new URL(req.url);
  if (url.searchParams.get("subir") === "1") {
    const type = url.searchParams.get("type") === "image/png" ? "image/png" : "image/jpeg";
    const { url: put } = await signPut(keyFor(id), type, 15 * 1024 * 1024);
    return json({ url: put, type });
  }
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Datos no válidos.");
  const theme = { ...(a.ev.theme ?? {}), bg: parsed.data.bg, overlay: parsed.data.overlay };
  await db().from("events").update({ theme }).eq("id", id);
  await audit(id, "admin", a.actor, "event.background", parsed.data);
  return json({ ok: true });
}

// Confirma la imagen subida y la deja como fondo
export async function PUT(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await adminEvent(id);
  if (!a) return fail("No autorizado.", 401);
  const key = keyFor(id);
  const info = await head(key);
  const bytes = await firstBytes(key);
  const kind = bytes ? sniffImage(bytes) : null;
  if (!info || (kind !== "image/jpeg" && kind !== "image/png")) return fail("El fondo debe ser JPG o PNG.");
  const theme = { ...(a.ev.theme ?? {}), bg: "imagen", bgKey: key, bgVersion: Date.now() };
  await db().from("events").update({ theme }).eq("id", id);
  await audit(id, "admin", a.actor, "event.background_image");
  return json({ ok: true });
}
