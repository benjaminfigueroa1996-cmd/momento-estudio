import { notFound } from "next/navigation";
import { getEventBySlug, albumOpen } from "@/lib/db";
import Album from "@/components/album/Album";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function AlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const ev = await getEventBySlug((await params).slug);
  if (!ev) notFound();
  return <Album slug={ev.slug} name={ev.name} hosts={ev.hosts_names} available={albumOpen(ev)} />;
}
