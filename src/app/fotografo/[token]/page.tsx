import { notFound } from "next/navigation";
import { photographerFromToken } from "@/lib/photographer";
import BatchUploader from "@/components/photographer/BatchUploader";

export const dynamic = "force-dynamic";
export const metadata = { title: "Carga del fotógrafo", robots: { index: false } };

export default async function Photographer({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const p = await photographerFromToken(token);
  if (!p) notFound();
  return <BatchUploader token={token} photographer={p.name} event={p.event.name} hosts={p.event.hosts_names} maxMb={p.event.max_file_mb} />;
}
