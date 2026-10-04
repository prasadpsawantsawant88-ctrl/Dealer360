"use client";
import { useState } from "react";
import { Page, KpiBullet, Panel, Source } from "@/components/ui";
import { DealerPicker, useSelection } from "@/components/Selection";
import { getDealer } from "@/lib/data";
import planJson from "@/data/insights_plan.json";
import type { PlanItem } from "@/lib/types";

const all = planJson as unknown as Record<string, { plan: PlanItem[]; checkpoints: { day: number; label: string; gate: string; trigger: string }[] }>;
const GROUPS = ["Sales Training", "Inventory Rebalancing", "Customer Recovery", "Process Optimization", "Performance Monitoring"];

export default function ActionPlan() {
  const { queuedId } = useSelection();
  const d = getDealer(queuedId); const { plan, checkpoints } = all[queuedId];
  const [day, setDay] = useState(45);
  const [hov, setHov] = useState<string | null>(null);
  const item = plan.find((p) => p.id === hov);
  const prog = (s: number, e: number) => Math.round(Math.max(0, Math.min(1, (day - s + 1) / (e - s + 1))) * 100);
  const pos = (v: number) => `${(v / 90) * 100}%`;
  return (
    <>
      <Page
        title={["90-Day", "Turnaround", "Plan"]}
        lede={`Structured intervention roadmap for ${d.name}. Initiatives are selected from the diagnosis (sales training only if salespeople are flagged, inventory moves only if stock is ageing) and targets are set from the dealer's current KPIs.`}
        left={<div className="space-y-5"><ul className="space-y-3 border-l border-steel pl-5"><KpiBullet>{plan.length} Prioritized Initiatives</KpiBullet><KpiBullet>{checkpoints.length} Escalation Checkpoints</KpiBullet></ul><DealerPicker /></div>}
      >
        <Panel>
          <div className="mb-3 flex items-center gap-3 text-sm text-navy">
            <label htmlFor="day" className="font-medium">Plan day</label>
            <input id="day" type="range" min={0} max={90} value={day} onChange={(e) => setDay(Number(e.target.value))} className="flex-1 accent-[#D83038]" />
            <span className="w-14 text-right font-semibold">Day {day}</span>
          </div>
          <div className="relative" role="img" aria-label="Gantt chart of the 90-day turnaround plan">
            <div className="relative h-6 text-[10px] text-navy/70">
              {[0, 30, 60, 90].map((v) => (<span key={v} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `calc(130px + (100% - 130px) * ${v / 90})` }}>Day {v}</span>))}
            </div>
            {GROUPS.filter((g) => plan.some((p) => p.workstream === g)).map((g) => (
              <div key={g} className="mb-2">
                <div className="text-xs font-semibold text-navy">{g}</div>
                {plan.filter((p) => p.workstream === g).map((p) => {
                  const pr = prog(p.start, p.end);
                  return (
                    <div key={p.id} className="flex items-center gap-2 py-0.5">
                      <div className="w-[122px] shrink-0 truncate text-[11px] text-navy/80" title={p.name}>{p.name}</div>
                      <div className="relative h-5 flex-1 bg-paper">
                        <button onMouseEnter={() => setHov(p.id)} onFocus={() => setHov(p.id)} onMouseLeave={() => setHov(null)} onBlur={() => setHov(null)} aria-label={`${p.name}, days ${p.start} to ${p.end}, ${pr}% complete`} className="absolute top-0 h-5 overflow-hidden rounded-[2px] bg-steel" style={{ left: pos(p.start - 1), width: pos(p.end - p.start + 1) }}>
                          <span className="block h-full" style={{ width: `${pr}%`, background: p.escalation && pr < 100 ? "#D83038" : "#285068" }} />
                        </button>
                        {checkpoints.map((c) => (<span key={c.day} aria-hidden className="absolute inset-y-0 w-px border-l border-dashed border-alert/60" style={{ left: pos(c.day) }} />))}
                        <span aria-hidden className="absolute -inset-y-0.5 w-0.5 bg-ink" style={{ left: pos(day) }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-3 min-h-[76px] rounded-sm bg-paper p-3 text-xs text-navy" aria-live="polite">
            {item ? (<><b>{item.name}</b><br />Owner: {item.owner} · Deadline: Day {item.end} · Target: {item.target} · Progress: {prog(item.start, item.end)}%{item.escalation && <><br />Escalation trigger: {item.escalation}</>}</>) : "Hover or focus a bar to see its owner, deadline, target and progress. Red bars carry an escalation trigger; dashed lines mark checkpoints."}
          </div>
          <Source />
        </Panel>
      </Page>
      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {checkpoints.map((c) => (
          <Panel key={c.day} className={day >= c.day ? "border-navy" : ""}>
            <div className="display text-2xl text-alert">Day {c.day}</div>
            <div className="mt-1 text-sm font-medium text-navy">{c.label}</div>
            <p className="mt-2 text-xs text-navy/85"><b>Gate:</b> {c.gate}</p>
            <p className="mt-1 text-xs text-navy/85"><b>Escalate if:</b> {c.trigger}</p>
          </Panel>
        ))}
      </section>
    </>
  );
}
