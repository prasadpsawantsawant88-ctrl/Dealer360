"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Page, Kpi, Panel, Source, Chip, ChartTip, chartAxis, Callout } from "@/components/ui";
import { DealerPicker, useSelection } from "@/components/Selection";
import { C } from "@/lib/theme";
import { aggregates, getDealer } from "@/lib/data";
import { classify } from "@/lib/classify";
import insJson from "@/data/insights_complaints.json";

const ins = insJson as unknown as Record<string, any>;
const SERIES = [["Critical", C.red], ["At-Risk", C.navy], ["Watch", C.steel], ["Normal", C.steelDark]] as const;

export default function Complaints() {
  const { queuedId, setSp } = useSelection();
  const d = getDealer(queuedId); const x = ins[queuedId]; const net = aggregates.networkComplaintStats;
  const [scope, setScope] = useState<"dealer" | "all">("dealer");
  const [cat, setCat] = useState<string>("");
  const topCat = useMemo(() => [...x.matrix].sort((a: any, b: any) => (b.Critical + b["At-Risk"] + b.Watch + b.Normal) - (a.Critical + a["At-Risk"] + a.Watch + a.Normal))[0].category, [x]);
  const active = cat || topCat;
  const data = scope === "dealer" ? x.matrix : aggregates.complaintMatrix.all;
  const people = (x.people as any[]).map((p) => ({ ...p, n: p.counts[active] || 0 })).filter((p) => p.n > 0).sort((a, b) => b.n - a.n).slice(0, 4);
  const flagged = x.flagged as any[];
  const flaggedByCat = flagged.filter((f) => f.topCategory === active).length;
  return (
    <>
      <Page
        title={["Complaint", "Intelligence"]}
        lede="Transform unstructured customer feedback into actionable operational signals. Keyword NLP assigns each complaint a theme, severity and journey stage; salesperson-level analysis flags outliers requiring coaching; escalation priorities come from complaint frequency, severity and resolution time."
        left={
          <div className="space-y-6">
            <DealerPicker />
            <div className="flex flex-wrap gap-10">
              <Kpi small value={`${x.stats.resolutionRatePct}%`} label={`Resolution rate (network ${net.resolutionRatePct}%)`} />
              <Kpi small value={`${x.stats.repeatRatePct}%`} label={`Repeat complaints (network ${net.repeatRatePct}%)`} />
            </div>
            {flagged.length > 0 ? (
              <Callout>{d.name}: {flagged.length} {flagged.length > 1 ? "salespeople" : "salesperson"} flagged for complaint incidence 1.5× or more of the peer median ({flagged.map((f) => f.name).join(", ")}). Top category: {topKeyOf(flagged)}. Recommended action: coaching intervention within 7 days.</Callout>
            ) : (
              <p className="text-sm text-navy">No salesperson at {d.name} exceeds 1.5× the peer median; complaints are a process issue rather than an individual one.</p>
            )}
            {flagged.length > 0 && <Link onClick={() => setSp(flagged[0].id)} href={`/salespeople/${flagged[0].id}`} className="inline-block rounded-sm bg-navy px-4 py-2 text-sm text-white hover:bg-ink">Open salesperson analysis</Link>}
          </div>
        }
      >
        <Panel>
          <div className="mb-2 flex flex-wrap gap-2"><Chip active={scope === "dealer"} onClick={() => setScope("dealer")}>{d.name} ({x.stats.n})</Chip><Chip active={scope === "all"} onClick={() => setScope("all")}>Whole network ({aggregates.totals.complaints.toLocaleString()})</Chip></div>
          <div className="h-[380px]" role="img" aria-label="Grouped column chart of complaints by category and severity">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={1} barCategoryGap="16%" margin={{ left: -14, bottom: 30 }}>
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="category" {...chartAxis} interval={0} angle={-30} textAnchor="end" height={60} tick={{ fill: C.navy, fontSize: 11 }} />
                <YAxis {...chartAxis} />
                <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(40,80,104,0.06)" }} />
                <Legend verticalAlign="top" iconType="circle" />
                {SERIES.map(([k, color]) => (<Bar key={k} dataKey={k} fill={color} isAnimationActive={false} cursor="pointer" onClick={(e: any) => setCat(e.category)} />))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Source />
          <p className="mt-1 text-center text-xs text-navy/70">Click a column group to inspect that category for {d.name}.</p>
        </Panel>
      </Page>

      <section className="mt-12 grid gap-6 lg:grid-cols-2" aria-label={`${active} detail`}>
        <Panel title={`${active} — salespeople named on ${d.name} complaints`}>
          {people.length === 0 ? <p className="text-sm text-navy/70">No complaints in this category are attached to a named salesperson.</p> : (
            <table className="w-full text-sm"><tbody>{people.map((p) => (
              <tr key={p.id} className="border-b border-steel/40 last:border-0">
                <td className="py-2"><Link href={`/salespeople/${p.id}`} onClick={() => setSp(p.id)} className="font-medium text-navy hover:underline">{p.name}</Link></td>
                <td className="py-2 text-navy">{p.n} complaints</td>
                <td className="py-2 text-right text-xs text-navy/70">{p.incidence}× peer median</td>
              </tr>))}</tbody></table>
          )}
          <p className="mt-3 text-xs text-navy/70">Complaints are attributed to a salesperson only when that person is named on the record. {flaggedByCat} flagged {flaggedByCat === 1 ? "person has" : "people have"} this as their top category.</p>
        </Panel>
        <Panel title="Latest complaints in this category (auto-classified)">
          <ul className="space-y-3">
            {(x.recent[active] as any[]).length === 0 && <li className="text-sm text-navy/70">No complaints in this category.</li>}
            {(x.recent[active] as any[]).map((c) => { const k = classify(c.text); return (
              <li key={c.id} className="text-sm text-navy">
                <div className="flex flex-wrap items-center gap-2 text-xs"><span className="font-medium">{c.id}</span><span className="text-navy/60">{c.date}</span><span className="rounded-sm bg-navy/10 px-1.5 py-0.5">{k.theme}</span><span className={`rounded-sm px-1.5 py-0.5 ${c.severity === "Critical" ? "bg-alert/10 text-alert" : "bg-steel/40"}`}>{c.severity}</span></div>
                <p className="mt-1 leading-snug">{c.text}</p>
              </li>); })}
          </ul>
          <p className="mt-3 text-xs text-navy/70">Keyword classifier agreement with the logged theme: {(aggregates.classifierAccuracy * 100).toFixed(0)}% (synthetic text; real feedback would need a trained NLP model).</p>
        </Panel>
      </section>
    </>
  );
}

function topKeyOf(f: { topCategory: string }[]) {
  const m: Record<string, number> = {}; f.forEach((x) => (m[x.topCategory] = (m[x.topCategory] || 0) + 1));
  return Object.entries(m).sort((a, b) => b[1] - a[1])[0][0];
}
