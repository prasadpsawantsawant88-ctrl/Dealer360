"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Page, Panel, Source, Callout, Modal, StatusBadge, ChartTip, chartAxis } from "@/components/ui";
import { C } from "@/lib/theme";
import { aggregates, dealers, getDealer, DIM_LABELS, median, modelOutputs } from "@/lib/data";
import { useCountUp } from "@/hooks/useCountUp";
import { useSelection } from "@/components/Selection";

const DETAIL: Record<string, { label: string; get: (d: any) => number; fmt: (v: number) => string; lowerBetter?: boolean }[]> = {
  sales: [
    { label: "Conversion rate", get: (d) => d.kpis.conversionPct, fmt: (v) => `${v.toFixed(1)}%` },
    { label: "Units per month", get: (d) => d.unitsPerMonth, fmt: (v) => `${Math.round(v)}` },
    { label: "Sales growth YoY", get: (d) => d.kpis.salesGrowthPct, fmt: (v) => `${v.toFixed(1)}%` },
  ],
  csat: [
    { label: "CSI score", get: (d) => d.kpis.csi, fmt: (v) => v.toFixed(1) },
    { label: "Complaints per 100 sales", get: (d) => d.kpis.complaintsPer100, fmt: (v) => v.toFixed(1), lowerBetter: true },
    { label: "Avg resolution (days)", get: (d) => d.kpis.resolutionDays, fmt: (v) => v.toFixed(1), lowerBetter: true },
  ],
  inventory: [
    { label: "Stock aged 90+ days", get: (d) => d.kpis.inventoryOver90Pct, fmt: (v) => `${v.toFixed(1)}%`, lowerBetter: true },
    { label: "Avg days to sale", get: (d) => d.kpis.avgDaysToSale, fmt: (v) => `${Math.round(v)}`, lowerBetter: true },
  ],
  service: [
    { label: "Service revenue index", get: (d) => d.kpis.serviceRevenueIndex, fmt: (v) => `${Math.round(v)}` },
    { label: "Days sales outstanding", get: (d) => d.kpis.dsoDays, fmt: (v) => `${Math.round(v)}`, lowerBetter: true },
    { label: "Margin", get: (d) => d.kpis.marginPct, fmt: (v) => `${v.toFixed(1)}%` },
    { label: "Payment delay (days)", get: (d) => d.kpis.paymentDelayDays, fmt: (v) => v.toFixed(1), lowerBetter: true },
  ],
  compliance: [
    { label: "Training hours per person", get: (d) => d.kpis.trainingHours, fmt: (v) => v.toFixed(0) },
    { label: "Avg competency score", get: (d) => d.kpis.avgCompetency, fmt: (v) => v.toFixed(1) },
  ],
};

export function DealerView({ id }: { id: string }) {
  const d = getDealer(id);
  const router = useRouter();
  const sel = useSelection();
  useEffect(() => { if (sel.dealerId !== d.id) sel.setDealer(d.id); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.id]);
  const [dim, setDim] = useState<string>("csat");
  const [explain, setExplain] = useState(false);
  const score = useCountUp(d.health);
  const peers = dealers.filter((x) => x.region === d.region);
  const dimData = (Object.keys(DIM_LABELS) as string[]).map((k) => ({ key: k, name: k === "inventory" ? "Inventory Health" : DIM_LABELS[k], value: (d.dims as any)[k], regional: Math.round(median(peers.map((p) => (p.dims as any)[k]))) }));
  const trend = aggregates.healthTrend[d.id].slice(-12).map((t) => ({ month: t.month.slice(2), health: t.health }));
  const topDimension = [...dimData].sort((a, b) => a.value - b.value)[0];
  const color = d.status === "Healthy" ? C.navy : C.red;
  const shap = modelOutputs.shapContributions[d.id];

  return (
    <>
      <Page
        title={["Dealer 360", d.name]}
        lede={`${d.city}, ${d.region} region. Priority ${d.priority === "Monitor" ? "monitor" : d.priority}; primary driver: ${d.driver.toLowerCase()}.`}
        left={
          <div className="space-y-5">
            <div className="flex items-end gap-4">
              <div className="display text-[5.5rem] leading-none text-navy" aria-label={`Health score ${d.health} out of 100`}>{score}<span className="text-3xl text-navy/50"> / 100</span></div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-sm px-3 py-1 text-sm font-semibold tracking-wide" style={{ background: color, color: "#fff" }}>{d.status.toUpperCase().replace("-", " ")}</span>
              <span className={`text-sm font-medium ${d.trendPerQuarter < 0 ? "text-alert" : "text-navy"}`}>{d.trendPerQuarter > 0 ? "+" : ""}{d.trendPerQuarter} pts vs prior quarter</span>
              <span className="text-sm text-navy/70">Benchmark: P{d.regionalPercentile} Regional</span>
            </div>
            <p className="text-sm text-navy">90-day deterioration risk: <b>{Math.round(d.risk * 100)}%</b> · Priority <b>{d.priority}</b></p>
            <Callout>{d.driverNarrative}</Callout>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/diagnosis" className="rounded-sm bg-navy px-4 py-2 text-sm text-white hover:bg-ink">Open diagnosis</Link>
              <button onClick={() => setExplain(true)} className="rounded-sm border border-navy px-4 py-2 text-sm text-navy hover:bg-white">How is this score built?</button>
            </div>
            <label className="block text-xs text-navy/70">
              Switch dealer
              <select className="mt-1 block w-full max-w-xs rounded-sm border border-steel bg-white px-2 py-2 text-sm text-navy" value={d.id} onChange={(e) => router.push(`/dealers/${e.target.value}`)}>
                {[...dealers].sort((a, b) => a.rank - b.rank).map((x) => (<option key={x.id} value={x.id}>{x.name} — {x.health} ({x.status})</option>))}
              </select>
            </label>
          </div>
        }
      >
        <div className="space-y-6">
          <Panel title="Dimension scores (click a bar for KPI analysis)">
            <div className="h-[250px]" role="img" aria-label="Horizontal bar chart of health dimension scores">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dimData} layout="vertical" margin={{ left: 40, right: 20 }} barCategoryGap="22%">
                  <CartesianGrid horizontal={false} stroke={C.grid} />
                  <XAxis type="number" domain={[0, 100]} {...chartAxis} />
                  <YAxis type="category" dataKey="name" width={150} {...chartAxis} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(40,80,104,0.06)" }} />
                  <Bar dataKey="value" name="Score" isAnimationActive={false} cursor="pointer" onClick={(e: any) => setDim(e.key)}>
                    {dimData.map((x) => (<Cell key={x.key} fill={x.value < 65 ? C.red : C.navy} opacity={dim === x.key ? 1 : 0.75} />))}
                  </Bar>
                  <Bar dataKey="regional" name="Regional median" fill={C.steel} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Source />
          </Panel>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="12-month health trend">
              <div className="h-[210px]" role="img" aria-label="Line chart of the 12-month health score trend">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ left: -18, right: 8, top: 6 }}>
                    <CartesianGrid vertical={false} stroke={C.grid} />
                    <XAxis dataKey="month" {...chartAxis} interval={2} />
                    <YAxis domain={[40, 90]} {...chartAxis} />
                    <Tooltip content={<ChartTip />} />
                    <ReferenceLine y={65} stroke={C.red} strokeDasharray="4 4" label={{ value: "At-Risk < 65", fill: C.red, fontSize: 10, position: "insideBottomRight" }} />
                    <Line type="monotone" dataKey="health" name="Health score" stroke={C.navy} strokeWidth={2.5} dot={{ r: 3, fill: C.navy }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title="KPI analysis">
              <p className="mb-2 text-xs text-navy/70">{dimData.find((x) => x.key === dim)?.name} vs regional median</p>
              <table className="w-full text-sm">
                <tbody>
                  {DETAIL[dim].map((k) => {
                    const val = k.get(d); const med = median(peers.map((p) => k.get(p)));
                    const worse = k.lowerBetter ? val > med : val < med;
                    return (
                      <tr key={k.label} className="border-b border-steel/40 last:border-0">
                        <td className="py-2 text-navy">{k.label}</td>
                        <td className={`py-2 text-right font-medium ${worse ? "text-alert" : "text-navy"}`}>{k.fmt(val)}</td>
                        <td className="py-2 pl-3 text-right text-xs text-navy/60">median {k.fmt(med)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Panel>
          </div>
        </div>
      </Page>
      <Modal open={explain} onClose={() => setExplain(false)} title="How the health score is built">
        <p>Each KPI is normalised against regional peers and adjusted for the trailing 90-day trend. Five dimension scores are combined with weights calibrated on simulated history ({(modelOutputs.dimensions as any[]).map((x) => `${x.label} ${x.mlWeight}%`).join(", ")}).</p>
        <p className="mt-3">Contribution of each dimension to {d.name}&apos;s score versus the sample average ({modelOutputs.baselineHealth}):</p>
        <ul className="mt-2 space-y-1">
          {Object.keys(shap).map((k) => (<li key={k} className="flex justify-between"><span>{DIM_LABELS[k]}</span><b className={shap[k] < 0 ? "text-alert" : "text-navy"}>{shap[k] > 0 ? "+" : ""}{shap[k]} pts</b></li>))}
        </ul>
        <p className="mt-3 text-xs text-navy/70">Illustrative ML-calibrated prototype output.</p>
      </Modal>
    </>
  );
}
