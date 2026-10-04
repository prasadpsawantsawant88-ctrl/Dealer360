import { dealers } from "@/lib/data";
import { DealerView } from "@/components/views/DealerView";

export function generateStaticParams() {
  return dealers.map((d) => ({ id: d.id }));
}

export default async function DealerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DealerView id={id} />;
}
