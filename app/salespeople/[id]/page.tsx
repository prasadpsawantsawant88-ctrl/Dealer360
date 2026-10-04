import { salespeople } from "@/lib/data";
import { SalespersonView } from "@/components/views/SalespersonView";

export function generateStaticParams() {
  return salespeople.map((s) => ({ id: s.id }));
}

export default async function SalespersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SalespersonView id={id} />;
}
