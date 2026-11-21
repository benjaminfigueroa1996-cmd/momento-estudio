import { json, fail, rateLimit } from "@/lib/guard";

// Búsqueda de lugares para el cotizador.
// Con GOOGLE_MAPS_API_KEY usa Google Maps (Places API New); sin ella usa OpenStreetMap (Photon), gratis.
type Sugerencia = { id: string; titulo: string; detalle: string; lat?: number; lng?: number };

const KEY = () => process.env.GOOGLE_MAPS_API_KEY;

async function google(q: string, session: string): Promise<Sugerencia[]> {
  const r = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY()! },
    body: JSON.stringify({ input: q, includedRegionCodes: ["cl"], languageCode: "es", sessionToken: session }),
  });
  if (!r.ok) throw new Error(`google ${r.status}`);
  const d = (await r.json()) as { suggestions?: { placePrediction?: { placeId: string; structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } }; text?: { text: string } } }[] };
  return (d.suggestions ?? []).flatMap((s) => {
    const p = s.placePrediction;
    if (!p) return [];
    return [{ id: p.placeId, titulo: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "", detalle: p.structuredFormat?.secondaryText?.text ?? "" }];
  });
}

async function googleDetalle(id: string, session: string) {
  const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=es&sessionToken=${encodeURIComponent(session)}`, {
    headers: { "X-Goog-Api-Key": KEY()!, "X-Goog-FieldMask": "location,formattedAddress,displayName" },
  });
  if (!r.ok) throw new Error(`google ${r.status}`);
  const d = (await r.json()) as { location?: { latitude: number; longitude: number }; formattedAddress?: string; displayName?: { text: string } };
  if (!d.location) throw new Error("sin ubicación");
  return { lat: d.location.latitude, lng: d.location.longitude, direccion: d.formattedAddress ?? "", nombre: d.displayName?.text ?? "" };
}

async function photon(q: string): Promise<Sugerencia[]> {
  const u = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&bbox=-76,-56,-66,-17`;
  const r = await fetch(u, { headers: { "User-Agent": "MomentoEstudio/1.0 (cotizador)" } });
  if (!r.ok) throw new Error(`photon ${r.status}`);
  const d = (await r.json()) as { features?: { geometry: { coordinates: [number, number] }; properties: Record<string, string> }[] };
  return (d.features ?? [])
    .filter((f) => f.properties.countrycode === "CL")
    .map((f) => {
      const p = f.properties;
      const titulo = p.name ?? [p.street, p.housenumber].filter(Boolean).join(" ");
      const detalle = [p.name && p.street ? [p.street, p.housenumber].filter(Boolean).join(" ") : "", p.district, p.city ?? p.county, p.state].filter((x) => x && x !== titulo).join(", ");
      return { id: `osm:${f.geometry.coordinates[1]},${f.geometry.coordinates[0]}`, titulo, detalle, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] };
    })
    .filter((s) => s.titulo);
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") ?? "").trim().slice(0, 120);
  const id = (u.searchParams.get("id") ?? "").trim().slice(0, 300);
  const session = (u.searchParams.get("s") ?? "").replace(/[^A-Za-z0-9-]/g, "").slice(0, 64) || "x";
  if (!(await rateLimit("lugares", 200, 600))) return fail("Demasiadas búsquedas. Espera un momento.", 429);
  try {
    if (id) {
      if (!KEY()) return fail("Detalle no disponible");
      return json(await googleDetalle(id, session));
    }
    if (q.length < 3) return json({ sugerencias: [] });
    return json({ sugerencias: KEY() ? await google(q, session) : await photon(q) });
  } catch {
    return fail("No pudimos buscar el lugar ahora.", 502);
  }
}
