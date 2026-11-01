import { notFound } from "next/navigation";
import { operatorFromToken } from "@/lib/operator";
import OperatorPanel from "@/components/live/OperatorPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Operador de pantalla", robots: { index: false } };

export default async function Operator({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await operatorFromToken(token))) notFound();
  return <OperatorPanel token={token} />;
}
