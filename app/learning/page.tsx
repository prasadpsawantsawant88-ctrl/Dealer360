"use client";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel, Source, ChartTip, chartAxis, Title, Chip } from "@/components/ui";
import { C } from "@/lib/theme";
import { aggregates, getDealer } from "@/lib/data";
import { useSelection } from "@/components/Selection";

const NODES = [
  ["Intervention", "A coaching, stock or recovery action is launched with an owner and target."],
  ["Outcome", "Health score, conversion, complaints and ageing are measured after 90 days."],
  ["Effectiveness", "Outcome is tagged to the original recommendation and compared with matched controls."],
  ["Context", "Dealer profile, region, driver and timeline variance are stored with the result."],
  ["Model Recalibration", "Risk weights and action priorities are re-fitted on the new evidence."],
  ["Next-Best Action", "Recommendations for similar dealers rank higher or lower accordingly."],
];
const DRIVERS = ["Conversion / complaints", "CSI decline", "Inventory ageing", "Payment delays", "Compliance gaps"];

export default function Learning() {
  const [n, setN] = useState(0);
  const { queuedId } = useSelection();
  const [driver, setDriver] = useState(DRIVERS[0]);
  useEffect(() => setDriver(getDealer(queuedId).driver), [queuedId]);
  const rows = useMemo(() => aggregates.learningMatrix.filter((r) => r.driver === driver).sort((a, b) => b.meanHealthDelta - a.meanHealthDelta), [driver]);
  const best = rows[0];
  const R = 130, cx = 190, cy = 170;
  return (
    <>
      <div className="max-w-2xl"><Title lines={["Learning", "Loop"]} /></div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <Panel>
          <svg viewBox="0 0 380 340" className="mx-auto w-full max-w-[430px]" role="img" aria-label="Circular learning loop with six stages">
            <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.steel} strokeWidth="14" />
            <path d={`M ${cx} ${cy - R} A ${R} ${R} 0 0 1 ${cx + R * Math.sin((Math.PI * 2 * 2) / 6)} ${cy - R * Math.cos((Math.PI * 2 * 2) / 6)}`} fill="none" stroke={C.navy} strokeWidth="14" />
            {NODES.map(([label], i) => {
              const a = (Math.PI * 2 * i) / 6;
              const x = cx + R * Math.sin(a), y = cy - R * Math.cos(a);
              const out = 1.28;
              return (
                <g key={label} onClick={() => setN(i)} tabIndex={0} role="button" aria-label={label} onKeyDown={(e) => e.key === "Enter" && setN(i)} style={{ cursor: "pointer" }}>
                  <circle cx={x} cy={y} r={n === i ? 17 : 13} fill={n === i ? C.red : C.navy} stroke="#fff" strokeWidth="3" />
                  <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="600">{i + 1}</text>
                  <text x={cx + (x - cx) * out} y={cy + (y - cy) * out + 4} textAnchor={Math.abs(x - cx) < 5 ? "middle" : x > cx ? "start" : "end"} fontSize="11" fill={C.navy} fontWeight={n === i ? 700 : 400}>{label}</text>
                </g>
              );
            })}
            <text x={cx} y={cy - 2} textAnchor="middle" fontSize="14" fill={C.navy}>Learning</text>
            <text x={cx} y={cy + 16} textAnchor="middle" fontSize="14" fill={C.navy}>Loop ↺</text>
          </svg>
          <p className="mt-2 rounded-sm bg-paper p-3 text-sm text-navy" aria-live="polite"><b>{NODES[n][0]}.</b> {NODES[n][1]}</p>
        </Panel>
        <div className="space-y-4">
          <Panel title="Feedback Capture">
            <p className="text-sm leading-relaxed text-navy/90">Intervention outcomes are systematically captured and tagged to original recommendations. Success metrics, timeline variances and contextual factors feed back into the ML models, enabling continuous recalibration of risk weights and action priorities.</p>
            <p className="mt-2 text-xs text-navy/70">Sample: {aggregates.learningMatrix.reduce((a, r) => a + r.n, 0)} completed simulated interventions; gains are measured against matched control dealers.</p>
          </Panel>
          <Panel title="Next-Best-Action Refinement">
            <p className="text-sm leading-relaxed text-navy/90">The system learns which interventions work best for specific dealer profiles and conditions. Confidence scores improve over time, so regional managers see increasingly precise, context-aware next-best actions.</p>
          </Panel>
        </div>
      </div>
      <section className="mt-10" aria-label="Next-best-action ranking">
        <div className="mb-3 flex flex-wrap items-center gap-2"><h2 className="display mr-3 text-2xl text-navy">What worked before</h2>{DRIVERS.map((d) => (<Chip key={d} active={driver === d} onClick={() => setDriver(d)}>{d}</Chip>))}</div>
        <Panel>
          <p className="mb-2 text-sm text-navy">For dealers whose primary driver is <b>{driver.toLowerCase()}</b>, the highest expected health gain comes from <b>{best?.type}</b>: +{best?.meanHealthDelta} pts on average versus controls, {best ? Math.round(best.successRate * 100) : 0}% success rate, {best?.n} past cases.</p>
          <div className="h-[260px]" role="img" aria-label="Bar chart of average health gain by intervention type">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ left: 40, right: 16 }}>
                <CartesianGrid horizontal={false} stroke={C.grid} />
                <XAxis type="number" {...chartAxis} />
                <YAxis type="category" dataKey="type" width={170} {...chartAxis} />
                <Tooltip content={<ChartTip unit=" pts" />} />
                <Bar dataKey="meanHealthDelta" name="Avg health gain" isAnimationActive={false}>{rows.map((r, i) => (<Cell key={r.type} fill={i === 0 ? C.navy : C.steel} />))}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Source ml />
        </Panel>
      </section>
    </>
  );
}
