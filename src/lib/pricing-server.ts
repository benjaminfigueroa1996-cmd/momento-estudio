import "server-only";
import { db } from "./db";
import { mergePricing, type PricingConfig } from "./pricing";

export async function getPricing(): Promise<PricingConfig> {
  const { data } = await db().from("settings").select("value").eq("key", "pricing").maybeSingle();
  let raw: unknown = null;
  try { raw = data?.value ? JSON.parse(data.value as string) : null; } catch { raw = null; }
  return mergePricing(raw);
}
