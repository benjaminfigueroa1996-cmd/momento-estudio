import { endHostSession } from "@/lib/session";
import { json } from "@/lib/guard";

export async function POST() {
  await endHostSession();
  return json({ ok: true });
}
