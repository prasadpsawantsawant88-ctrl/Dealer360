"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [["/coach", "Scenario"], ["/coach/analysis", "Analysis"], ["/coach/impact", "Impact"]];

export function CoachTabs() {
  const p = usePathname();
  return (
    <div className="mb-8 flex gap-2" role="tablist" aria-label="AI Sales Coach sections">
      {TABS.map(([h, l]) => (
        <Link key={h} href={h} role="tab" aria-selected={p === h} className={`rounded-sm border px-4 py-1.5 text-sm ${p === h ? "border-navy bg-navy text-white" : "border-steel bg-white text-navy hover:border-navy"}`}>{l}</Link>
      ))}
    </div>
  );
}
