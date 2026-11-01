import LiveScreen from "@/components/live/LiveScreen";

export const metadata = { title: "Pantalla", robots: { index: false } };

export default async function Live({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ k?: string }> }) {
  const { slug } = await params;
  const { k } = await searchParams;
  return <LiveScreen slug={slug} screenKey={k ?? ""} />;
}
