import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "./env";
import { db } from "./db";

// Sesión firmada de anfitriones. Se revisa la revocación en cada solicitud.
const COOKIE = "me_host";

export async function startHostSession(eventId: string, accessId: string) {
  const jwt = await new SignJWT({ ev: eventId, acc: accessId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(env.sessionSecret());
  (await cookies()).set(COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function endHostSession() {
  (await cookies()).delete(COOKIE);
}

export async function hostSession(eventId: string) {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, env.sessionSecret());
    if (payload.ev !== eventId) return null; // aislamiento entre eventos
    const { data } = await db()
      .from("couple_access")
      .select("id, revoked_at, expires_at")
      .eq("id", payload.acc as string)
      .eq("event_id", eventId)
      .maybeSingle();
    const row = data as { id: string; revoked_at: string | null; expires_at: string | null } | null;
    if (!row || row.revoked_at || (row.expires_at && new Date(row.expires_at) < new Date())) return null;
    return { eventId, accessId: row.id };
  } catch {
    return null;
  }
}
