"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Page, Kpi, Panel, Source, Chip, StatusBadge, PriorityBadge, ChartTip } from "@/components/ui";
import { C } from "@/lib/theme";
import { aggregates, dealers } from "@/lib/data";
import { ArrowDown, ArrowUp } from "lucide-react";

const queue = dealers.filter((d) => d.priority !== "Monitor");
const REG_COLORS = [C.navy, C.red, C.steel, C.navySoft, C.redSoft];
type Key = "name" | "health" | "risk" | "priority" | "driver";

export default function PriorityQueue() {
  const [pf, setPf] = useState<string | null>(null);
  const [sort, setSort] = useState<Key>("priority");
  const [asc, setAsc] = useState(true);
  const regional = ["North", "South", "East", "West", "Central"].map((r) => ({ name: r, value: queue.filter((d) => d.region === r).length }));
  const rows = useMemo(() => {
    const f = queue.filter((d) => !pf || d.priority === pf);
    const dir = asc ? 1 : -1;
    return [...f].sort((a, b) => {
      if (sort === "priority") return (a.rank - b.rank) * dir;
      const x: any = a[sort]; const y: any = b[sort];
      return (x > y ? 1 : x < y ? -1 : 0) * dir;
    });
  }, [pf, sort, asc]);
  const th = (k: Key, label: string) => (
    <th className="p-3 font-medium">
      <button onClick={() => { if (sort === k) setAsc(!asc); else { setSort(k); setAsc(true); } }} className="flex items-center gap-1 hover:text-navy" aria-label={`Sort by ${label}`}>
        {label}{sort === k && (asc ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </button>
    </th>
  );
  return (
    <>
      <Page
        title={["Priority", "Queue"]}
        lede="Dealers flagged for intervention based on health score decline, complaint velocity, or inventory aging thresholds. Sorted by urgency and regional assignment."
        left={
          <div className="flex gap-12">
            <Kpi value={aggregates.network.p1} label="Require Attention (P1)" />
            <Kpi value={queue.length} label="Dealers in Queue (P1–P3)" />
          </div>
        }
      >
        <Panel title="Regional Workload">
          <div className="h-[320px]" role="img" aria-label="Donut chart of queued dealers by region">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={regional} dataKey="value" nameKey="name" innerRadius={70} outerRadius={120} paddingAngle={1} isAnimationActive={false} label={(e: any) => `${e.name} ${Math.round(e.percent * 100)}%`}>
                  {regional.map((r, i) => (<Cell key={r.name} fill={REG_COLORS[i]} stroke="#fff" />))}
                </Pie>
                <Tooltip content={<ChartTip unit=" dealers" />} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <Source />
        </Panel>
      </Page>

      <section className="mt-12" aria-label="Priority table">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="display mr-4 text-2xl text-navy">Intervention queue</h2>
          <Chip active={!pf} onClick={() => setPf(null)}>All {queue.length}</Chip>
          {["P1", "P2", "P3"].map((p) => (<Chip key={p} active={pf === p} onClick={() => setPf(pf === p ? null : p)}>{p}</Chip>))}
        </div>
        <Panel className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-steel/70 text-xs text-navy/70">
              <tr>{th("name", "Dealer")}{th("health", "Health")}{th("risk", "Risk")}{th("priority", "Priority")}{th("driver", "Driver")}<th className="p-3 font-medium">Region</th></tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-b border-steel/40 last:border-0 hover:bg-paper">
                  <td className="p-3"><Link href={`/dealers/${d.id}`} className="font-medium text-navy hover:underline">{d.name}</Link></td>
                  <td className="p-3"><span className="font-medium text-navy">{d.health}</span> <StatusBadge status={d.status} /></td>
                  <td className="p-3 text-navy">{Math.round(d.risk * 100)}%</td>
                  <td className="p-3"><PriorityBadge p={d.priority} /></td>
                  <td className="p-3 text-navy">{d.driver}</td>
                  <td className="p-3 text-navy">{d.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <p className="mt-2 text-xs text-navy/70">Priority = Risk × Business Impact × Controllability. Score cut-offs: P1 ≥ {aggregates.meta.priorityCutoffs.P1}, P2 ≥ {aggregates.meta.priorityCutoffs.P2}, P3 ≥ {aggregates.meta.priorityCutoffs.P3}; the queue holds {aggregates.network.p1} P1, {aggregates.network.p2} P2 and {aggregates.network.p3} P3 dealers.</p>
      </section>
    </>
  );
}
