"use client";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Page, Kpi, Panel, Source, ChartTip, chartAxis } from "@/components/ui";
import { DealerPicker, useSelection } from "@/components/Selection";
import { C } from "@/lib/theme";
import { aggregates, getDealer } from "@/lib/data";
import planJson from "@/data/insights_plan.json";

const all = planJson as unknown as Record<string, { outcome: any }>;

export default function Outcomes() {
  const { queuedId } = useSelection();
  const d = getDealer(queuedId); const o = all[queuedId].outcome; const did = aggregates.did;
  const data = [
    { m: "Health Score", before: o.before.health, after: o.after.health },
    { m: "Conversion Rate %", before: o.before.conversionPct, after: o.after.conversionPct },
    { m: "Complaints per 100 Sales", before: o.before.complaintsPer100, after: o.after.complaintsPer100 },
    { m: "Sales (units / month)", before: o.before.unitsPerMonth, after: o.after.unitsPerMonth },
    { m: "Days to Sale", before: o.before.daysToSale, after: o.after.daysToSale },
    { m: "Units aged 90+ days", before: o.before.aged90, after: o.after.aged90 },
  ];
  const sign = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n);
  return (
    <Page
      title={["Outcome", "Tracking"]}
      left={
        <div className="space-y-6">
          <DealerPicker />
          <div className="flex flex-wrap gap-10"><Kpi value={`${sign(o.healthDelta)}pts`} label="Health Score Δ" /><Kpi value={`${sign(o.conversionLiftPct)}%`} label="Conversion Lift" /></div>
          <p className="max-w-md text-sm leading-relaxed text-navy/85">Projected 90-day result for {d.name} if the plan is executed: aged stock {sign(o.agedChangePct)}%, complaints per 100 sales {sign(o.complaintChangePct)}%. Effects come from what similar dealers achieved with {o.basis} in the simulated intervention history.</p>
          <p className="max-w-md text-sm leading-relaxed text-navy/85">Attribution uses difference-in-differences against matched control dealers: treated dealers improved {did.treatedMeanDelta} pts (n={did.nTreated}) versus {did.controlMeanDelta} pts for controls (n={did.nControl}), so {did.attributedDelta} pts is attributable (t={did.tStat}, p {did.pValue <= 0.0001 ? "< 0.001" : "= " + did.pValue}). This is a simulation result, not evidence from real dealers.</p>
        </div>
      }
    >
      <Panel>
        <div className="h-[400px]" role="img" aria-label={`Before and after grouped column chart for ${d.name}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2} barCategoryGap="16%" margin={{ left: -14, bottom: 50 }}>
              <CartesianGrid vertical={false} stroke={C.grid} />
              <XAxis dataKey="m" {...chartAxis} interval={0} angle={-35} textAnchor="end" height={80} tick={{ fill: C.navy, fontSize: 11 }} />
              <YAxis {...chartAxis} />
              <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(40,80,104,0.06)" }} />
              <Legend verticalAlign="top" iconType="circle" />
              <Bar dataKey="before" name="Before" fill={C.navy} isAnimationActive={false} />
              <Bar dataKey="after" name="After (projected)" fill={C.steel} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Source />
      </Panel>
    </Page>
  );
}
