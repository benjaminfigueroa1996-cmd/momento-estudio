import "server-only";
import { headers } from "next/headers";
import { db } from "./db";
import { ipHash } from "./crypto";

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "0.0.0.0";
}

export async function rateLimit(scope: string, max: number, windowSeconds: number) {
  const key = `${scope}:${ipHash(await clientIp())}`;
  const { data, error } = await db().rpc("hit_rate_limit", { p_key: key, p_max: max, p_window_seconds: windowSeconds });
  if (error) return true; // no bloquear el evento si falla el contador; queda en registros
  return data === true;
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function fail(message: string, status = 400) {
  return json({ error: message }, status);
}
