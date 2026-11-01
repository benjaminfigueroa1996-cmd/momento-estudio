import { notFound } from "next/navigation";
import { getEventBySlug, db } from "@/lib/db";
import { hostSession } from "@/lib/session";
import HostLogin from "@/components/host/HostLogin";
import HostPanel from "@/components/host/HostPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tus recuerdos", robots: { index: false } };

export default async function Hosts({ params }: { params: Promise<{ slug: string }> }) {
  const ev = await getEventBySlug((await params).slug);
  if (!ev) notFound();
  const session = await hostSession(ev.id);
  if (!session) return <HostLogin slug={ev.slug} name={ev.name} />;

  const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
  const base = () => db().from("media").select("id", { count: "exact", head: true }).eq("event_id", ev.id).eq("status", "ready");
  const [total, pro, edited, messages] = await Promise.all([
    count(base()),
    count(base().eq("source", "photographer")),
    count(base().eq("source", "station")),
    count(db().from("messages").select("id", { count: "exact", head: true }).eq("event_id", ev.id)),
  ]);
  return <HostPanel slug={ev.slug} name={ev.name} hosts={ev.hosts_names} stats={{ total, pro, edited, messages }} />;
}
