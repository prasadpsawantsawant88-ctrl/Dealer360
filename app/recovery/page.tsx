"use client";
import { useState } from "react";
import { Page, KpiBullet, Panel, Source, Chip } from "@/components/ui";
import { DealerPicker, useSelection } from "@/components/Selection";
import { aggregates, getDealer } from "@/lib/data";
import insJson from "@/data/insights_complaints.json";

const ins = insJson as unknown as Record<string, any>;
const FILL = ["#285068", "#A9B2BC", "#D83038", "#DDE4EE", "#E6EAF0", "#C0C8D0"];

export default function Recovery() {
  const { queuedId } = useSelection();
  const d = getDealer(queuedId);
  const [scope, setScope] = useState<"dealer" | "all">("dealer");
  const f = scope === "dealer" ? (ins[queuedId].funnel as any[]) : aggregates.funnel;
  const st = scope === "dealer" ? ins[queuedId].stats : aggregates.networkComplaintStats;
  const [sel, setSel] = useState(2);
  const drops = f.slice(1).map((s, i) => ({ stage: s.stage, lost: f[i].pct - s.pct }));
  const worst = [...drops].sort((a, b) => b.lost - a.lost)[0];
  const W = 300, H = 56, CX = 400;
  return (
    <Page
      title={["Customer", "Recovery"]}
      lede="Transform customer complaints into structured recovery workflows with clear ownership, SLA tracking and resolution status. Each simulated case walks six stages with drop-off and elapsed time that depend on dealer health, severity and case age."
      left={
        <div className="space-y-5">
          <ul className="space-y-3 border-l border-steel pl-5"><KpiBullet>{st.recoveryRatePct}% Recovery Rate (closed cases, customer retained)</KpiBullet><KpiBullet>{st.avgResolutionDays} Day Avg Resolution Time (recovered cases)</KpiBullet></ul>
          <DealerPicker />
        </div>
      }
    >
      <Panel>
        <div className="mb-2 flex gap-2"><Chip active={scope === "dealer"} onClick={() => setScope("dealer")}>{d.name}</Chip><Chip active={scope === "all"} onClick={() => setScope("all")}>Whole network</Chip></div>
        <svg viewBox="0 0 700 360" className="w-full" role="img" aria-label="Recovery funnel from complaint received to recovery complete">
          <text x="14" y="190" transform="rotate(-90 14 190)" textAnchor="middle" fontSize="12" fill="#285068">Workflow Stage</text>
          {f.map((s, i) => {
            const top = (s.pct / 100) * W, bot = ((f[i + 1]?.pct ?? s.pct) / 100) * W, y = i * H + 10;
            return (
              <g key={s.stage} onClick={() => setSel(i)} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label={`${s.stage}: ${s.pct}%`} onKeyDown={(e) => e.key === "Enter" && setSel(i)}>
                <path d={`M${CX - top / 2} ${y} L${CX + top / 2} ${y} L${CX + bot / 2} ${y + H - 2} L${CX - bot / 2} ${y + H - 2} Z`} fill={FILL[i]} stroke={sel === i ? "#14202B" : "none"} strokeWidth="2" />
                <text x={CX - W / 2 - 24} y={y + H / 2 + 4} textAnchor="end" fontSize="13" fill="#285068" fontWeight={sel === i ? 700 : 400}>{s.stage}</text>
                <text x={CX + W / 2 + 24} y={y + H / 2 + 4} fontSize="13" fill="#285068" fontWeight={sel === i ? 700 : 400}>{s.pct}%</text>
              </g>
            );
          })}
        </svg>
        <Source />
      </Panel>
      <Panel className="mt-4" title={f[sel].stage}>
        <p className="text-sm text-navy"><b>{f[sel].count.toLocaleString()}</b> of {f[0].count.toLocaleString()} complaints reached this stage ({f[sel].pct}%){sel > 0 ? `; ${(f[sel - 1].pct - f[sel].pct).toFixed(1)} pts lost from the previous stage` : ""}.</p>
        <p className="mt-2 text-xs text-navy/80">Largest drop-off in this view: before &ldquo;{worst.stage}&rdquo; ({worst.lost.toFixed(1)} pts). Route those cases first.</p>
        <p className="mt-2 text-xs text-navy/60">The funnel is a live pipeline snapshot, so recent open cases count against later stages. Recovery rate covers closed cases only (recovered ÷ recovered + lost after 45 days).</p>
      </Panel>
    </Page>
  );
}
