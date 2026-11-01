import QRCode from "qrcode";
import { adminEvent } from "@/lib/admin-event";
import { env } from "@/lib/env";
import { fail } from "@/lib/guard";

// QR del evento en SVG (imprenta) o PNG (pantallas y mensajería)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await adminEvent(id);
  if (!a) return fail("No autorizado.", 401);
  const url = `${env.siteUrl()}/e/${a.ev.slug}`;
  const format = new URL(req.url).searchParams.get("format") === "png" ? "png" : "svg";
  const opts = { margin: 2, errorCorrectionLevel: "M" as const, color: { dark: "#242321", light: "#FFFEFC" } };
  if (format === "svg") {
    const svg = await QRCode.toString(url, { ...opts, type: "svg" });
    return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Content-Disposition": `attachment; filename="qr-${a.ev.slug}.svg"` } });
  }
  const png = await QRCode.toBuffer(url, { ...opts, width: 2048 });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Content-Disposition": `attachment; filename="qr-${a.ev.slug}.png"` } });
}
