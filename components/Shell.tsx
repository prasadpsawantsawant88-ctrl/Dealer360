"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, MoreHorizontal, X, ArrowRight } from "lucide-react";
import { SelectionProvider, useSelection } from "@/components/Selection";

const NAV_BASE = [
  { href: "/overview", label: "Overview", match: ["/overview"] },
  { href: "/priority-queue", label: "Priority Queue", match: ["/priority-queue"] },
  { href: "/dealers/:d", label: "Dealers", match: ["/dealers"] },
  { href: "/diagnosis", label: "Diagnosis", match: ["/diagnosis", "/explainability"] },
  { href: "/complaints", label: "Complaints", match: ["/complaints"] },
  { href: "/salespeople/:s", label: "Salespeople", match: ["/salespeople"] },
  { href: "/coach", label: "AI Sales Coach", match: ["/coach"] },
  { href: "/inventory", label: "Inventory", match: ["/inventory"] },
  { href: "/recovery", label: "Customer Recovery", match: ["/recovery"] },
  { href: "/action-plan", label: "Action Plan", match: ["/action-plan"] },
  { href: "/outcomes", label: "Outcomes", match: ["/outcomes"] },
  { href: "/learning", label: "Learning", match: ["/learning"] },
  { href: "/methodology", label: "Methodology", match: ["/methodology"] },
];

// Guided demo order (hero journey)
const JOURNEY = [
  ["/", "Cover"], ["/overview", "Network Health"], ["/priority-queue", "Priority Queue"], ["/dealers", "Dealer 360"],
  ["/explainability", "Health Score Explainability"], ["/diagnosis", "Diagnosis Engine"], ["/complaints", "Complaint Intelligence"],
  ["/salespeople", "Salesperson Profile"], ["/coach", "AI Sales Coach"], ["/coach/analysis", "Coach Analysis"], ["/coach/impact", "Coaching Impact"], ["/coach/training", "Pitch Training"],
  ["/inventory", "Inventory Optimizer"], ["/recovery", "Customer Recovery"], ["/action-plan", "90-Day Plan"], ["/outcomes", "Outcome Tracking"],
  ["/learning", "Learning Loop"], ["/methodology", "Methodology"], ["/value", "Dealer360 Value"],
];


function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Dealer360 home">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
        <path d="M13 1 24 7v12l-11 6L2 19V7z" fill="#D83038" />
        <path d="M13 7 19 10.5v5L13 19l-6-3.5v-5z" fill="#F8F8F8" />
        <circle cx="13" cy="13" r="2.4" fill="#D83038" />
      </svg>
      <span className="text-sm font-medium text-navy">Dealer360</span>
    </Link>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (<SelectionProvider><ShellInner>{children}</ShellInner></SelectionProvider>);
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const { dealerId, spId } = useSelection();
  const fix = (h: string) => h.replace(":d", dealerId).replace(":s", spId);
  const NAV = NAV_BASE.map((n) => ({ ...n, href: fix(n.href) }));
  const JOURNEY_HREF: Record<string, string> = { "/dealers": `/dealers/${dealerId}`, "/salespeople": `/salespeople/${spId}` };
  const path = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  // Longest matching route wins, so /coach/analysis is not mistaken for /coach.
  const idx = JOURNEY.reduce((best, [p], i) => {
    const hit = p === "/" ? path === "/" : path === p || path.startsWith(p + "/");
    return hit && (best < 0 || p.length > JOURNEY[best][0].length) ? i : best;
  }, -1);
  const next = idx >= 0 && idx < JOURNEY.length - 1 ? JOURNEY[idx + 1] : null;
  const isActive = (m: string[]) => m.some((x) => path === x || path.startsWith(x + "/"));

  const nav = (
    <nav aria-label="Primary" className="flex flex-col gap-0.5">
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          onClick={() => setOpen(false)}
          aria-current={isActive(n.match) ? "page" : undefined}
          className={`rounded-sm border-l-2 px-3 py-2 text-[13px] transition-colors ${isActive(n.match) ? "border-alert bg-white font-medium text-navy" : "border-transparent text-navy/70 hover:bg-white hover:text-navy"}`}
        >
          {n.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-steel/60 bg-paper px-4 py-6 lg:flex">
        <div className="mb-8 px-3"><Logo /></div>
        {nav}
        <p className="mt-auto px-3 text-[11px] leading-snug text-navy/60">Illustrative prototype data. Not a production system.</p>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-steel/60 bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <button aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)} className="rounded p-1 text-navy">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>
      {open && <div className="border-b border-steel/60 bg-paper px-4 py-3 lg:hidden">{nav}</div>}

      <div className="relative lg:pl-60">
        <div className="absolute right-6 top-5 z-20 lg:right-10">
          <button aria-label="Page options" aria-expanded={menu} onClick={() => setMenu(!menu)} className="rounded p-1 text-navy hover:bg-white">
            <MoreHorizontal size={22} />
          </button>
          {menu && (
            <div role="menu" className="absolute right-0 mt-1 w-48 rounded border border-steel/70 bg-white p-1 text-sm shadow-sm">
              {[["/", "Cover"], ["/methodology", "Methodology"], ["/value", "Final value"]].map(([h, l]) => (
                <Link key={h} href={h} role="menuitem" onClick={() => setMenu(false)} className="block rounded px-3 py-2 text-navy hover:bg-paper">{l}</Link>
              ))}
              <button role="menuitem" className="block w-full rounded px-3 py-2 text-left text-navy hover:bg-paper" onClick={() => { sessionStorage.removeItem("d360_session"); setMenu(false); }}>
                Reset coaching session
              </button>
            </div>
          )}
        </div>
        <svg aria-hidden className="pointer-events-none absolute right-0 top-0 hidden h-[260px] w-[420px] md:block" viewBox="0 0 420 260">
          <line x1="130" y1="0" x2="420" y2="165" stroke="#C0C8D0" strokeWidth="3" />
        </svg>
        <main key={path} className="page-fade relative mx-auto max-w-[1320px] px-5 pb-24 pt-10 lg:px-12 lg:pt-14">
          {children}
          {next && (
            <div className="mt-16 flex justify-end">
              <Link href={JOURNEY_HREF[next[0]] ?? next[0]} className="group flex items-center gap-2 rounded-sm border border-navy px-4 py-2 text-sm text-navy transition-colors hover:bg-navy hover:text-white">
                Next: {next[1]} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
