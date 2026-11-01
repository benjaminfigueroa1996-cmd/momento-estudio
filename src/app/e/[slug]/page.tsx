import { notFound } from "next/navigation";
import { getEventBySlug, uploadsOpen, albumOpen } from "@/lib/db";
import GuestFlow from "@/components/guest/GuestFlow";
import { signGet } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const ev = await getEventBySlug((await params).slug);
  return { title: ev ? ev.name : "Evento", robots: { index: false } };
}

export default async function GuestPage({ params }: { params: Promise<{ slug: string }> }) {
  const ev = await getEventBySlug((await params).slug);
  if (!ev) notFound();
  const cover = ev.cover_key ? await signGet(ev.cover_key, { seconds: 7200 }) : null;
  return (
    <GuestFlow
      slug={ev.slug}
      cover={cover}
      name={ev.name}
      hosts={ev.hosts_names}
      open={uploadsOpen(ev)}
      albumOpen={albumOpen(ev)}
      moderatedScreen={ev.moderate_screen}
      maxFiles={Math.min(20, ev.max_uploads_per_guest)}
    />
  );
}
