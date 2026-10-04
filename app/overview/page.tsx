"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Page, Kpi, KpiBullet, Panel, Source, Chip, StatusBadge, PriorityBadge, ChartTip, chartAxis } from "@/components/ui";
import { C } from "@/lib/theme";
import { aggregates, dealers } from "@/lib/data";

const NET = aggregates.network;

const SERIES = [
  { key: "healthy", name: "Healthy (%)", color: C.navy, status: "Healthy" },
  { key: "watch", name: "Watch (%)", color: C.red, status: "Watch" },
  { key: "atRisk", name: "At-Risk (%)", color: C.steel, status: "At-Risk" },
];
const REGIONS = ["North", "South", "East", "West", "Central"];

export default function Overview() {
  const [region, setRegion] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const rows = useMemo(
    () => dealers.filter((d) => (!region || d.region === region) && (!status || d.status === status)).sort((a, b) => b.risk - a.risk),
    [region, status],
  );
  return (
    <>
      <Page
        title={["Network", "Health", "Overview"]}
        lede="Executive dashboard providing real-time visibility into dealer network performance, identifying at-risk locations requiring immediate intervention and surfacing priority actions for regional managers."
        left={
          <ul className="space-y-3 border-l border-steel pl-5">
            <KpiBullet>{NET.dealers} Active Dealers Monitored</KpiBullet>
            <KpiBullet>{NET.criticalAlerts} Critical Risk Alerts (At-Risk, 70%+ deterioration risk)</KpiBullet>
          </ul>
        }
      >
        <Panel>
          <div className="h-[400px]" role="img" aria-label="Grouped column chart of healthy, watch and at-risk dealer share by region">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregates.regionShares} barGap={2} barCategoryGap="18%" margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="region" {...chartAxis} />
                <YAxis {...chartAxis} unit="%" domain={[0, 80]} />
                <Tooltip content={<ChartTip unit="%" />} cursor={{ fill: "rgba(40,80,104,0.06)" }} />
                <Legend
                  verticalAlign="top"
                  iconType="circle"
                  onClick={(e: any) => { const s = SERIES.find((x) => x.key === e.dataKey); if (s) setStatus(status === s.status ? null : s.status); }}
                />
                {SERIES.map((s) => (
                  <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} cursor="pointer" isAnimationActive={false}
                    onClick={(d: any) => { setRegion(d.region); setStatus(s.status); }} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Source />
          <p className="mt-1 text-center text-xs text-navy/70">Click a bar to filter the dealer list. Click a legend item to filter by status.</p>
        </Panel>
      </Page>

      <section className="mt-14" aria-label="Dealer list">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="display mr-4 text-2xl text-navy">Dealers in the network</h2>
          <Chip active={!region} onClick={() => setRegion(null)}>All regions</Chip>
          {REGIONS.map((r) => (<Chip key={r} active={region === r} onClick={() => setRegion(region === r ? null : r)}>{r}</Chip>))}
          <span className="mx-2 h-4 w-px bg-steel" />
          <Chip active={!status} onClick={() => setStatus(null)}>All status</Chip>
          {["Healthy", "Watch", "At-Risk"].map((s) => (<Chip key={s} active={status === s} onClick={() => setStatus(status === s ? null : s)}>{s}</Chip>))}
        </div>
        <Panel className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-steel/70 text-xs text-navy/70">
              <tr><th className="p-3 font-medium">Dealer</th><th className="p-3 font-medium">Region</th><th className="p-3 font-medium">Health</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">90-day risk</th><th className="p-3 font-medium">Priority</th></tr>
            </thead>
            <tbody>
              {rows.slice(0, 12).map((d) => (
                <tr key={d.id} className="border-b border-steel/40 last:border-0 hover:bg-paper">
                  <td className="p-3"><Link className="font-medium text-navy underline-offset-2 hover:underline" href={`/dealers/${d.id}`}>{d.name}</Link><div className="text-xs text-navy/60">{d.city}</div></td>
                  <td className="p-3 text-navy">{d.region}</td>
                  <td className="p-3 font-medium text-navy">{d.health}</td>
                  <td className="p-3"><StatusBadge status={d.status} /></td>
                  <td className="p-3 text-navy">{Math.round(d.risk * 100)}%</td>
                  <td className="p-3"><PriorityBadge p={d.priority} /></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-navy/70">No dealers match these filters. Clear a filter to see the list.</td></tr>}
            </tbody>
          </table>
        </Panel>
        <p className="mt-2 text-xs text-navy/70">Showing {Math.min(12, rows.length)} of {rows.length} dealers, sorted by 90-day deterioration risk. Regional mix and list are computed from the same {dealers.length}-dealer simulated network. <Link className="underline" href="/priority-queue">Open the full priority queue</Link>.</p>
      </section>
    </>
  );
}
