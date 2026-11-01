import "server-only";
import { db, type EventRow } from "./db";
import { isAdminRequest } from "./admin";

// Permite al administrador (o al operador de pantalla cuando allowOperator) operar sobre un evento
export async function adminEvent(id: string): Promise<{ ev: EventRow; actor: string } | null> {
  const user = await isAdminRequest();
  if (!user) return null;
  const { data } = await db().from("events").select("*").eq("id", id).maybeSingle();
  return data ? { ev: data as EventRow, actor: `admin:${user.id}` } : null;
}
