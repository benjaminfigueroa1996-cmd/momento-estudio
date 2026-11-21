import { getPricing } from "@/lib/pricing-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = await getPricing();
  return Response.json(cfg, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
