"use client";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { Page, Panel, Source, ChartTip, chartAxis } from "@/components/ui";
import { DealerPicker, useSelection } from "@/components/Selection";
import { C } from "@/lib/theme";
import { modelOutputs, DIM_LABELS, getDealer } from "@/lib/data";

export default function Explainability() {
  const dims = modelOutputs.dimensions as any[];
  const [sel, setSel] = useState<string | null>(null);
  const { dealerId } = useSelection();
  const d = getDealer(dealerId);
  const shap = modelOutputs.shapContributions[d.id];
  const data = dims.map((x) => ({ name: x.label === "Inventory Health" ? "Inventory Turnover" : x.label, key: x.key, weight: x.mlWeight, ci: x.confidencePm }));
  const shapData = Object.keys(shap).map((k) => ({ name: DIM_LABELS[k], value: shap[k] }));
  const cur = dims.find((x) => x.key === sel);
  const risk = modelOutputs.riskModel; const fit = modelOutputs.weightFit;
  return (
    <>
      <Page
        title={["Health Score", "Explainability"]}
        left={
          <div className="space-y-6">
            <div><div className="display text-3xl text-alert">01</div><h3 className="mt-1 text-sm font-semibold text-navy">KPI Normalization</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-navy/85">Raw KPIs are normalised against regional peers and adjusted for trailing 90-day trends. Higher-is-better KPIs (conversion, CSI, margin, sales growth) and lower-is-better KPIs (DSO, inventory days, complaint rate, payment delay) are flipped onto one 0–100 scale before they enter a dimension.</p></div>
            <div><div className="display text-3xl text-alert">02</div><h3 className="mt-1 text-sm font-semibold text-navy">Calibrated Weights</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-navy/85">Dimension weights are fitted by regression of a simulated 12-month performance index on dimension scores ({fit.nHistory.toLocaleString()} simulated dealer histories, R² {fit.rSquared}). The confidence range is a 95% bootstrap interval from 150 resamples.</p></div>
            <DealerPicker />
          </div>
        }
      >
        <Panel>
          <div className="h-[330px]" role="img" aria-label="Horizontal bar chart of health-score dimension weights with confidence ranges">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" barGap={1} barCategoryGap="20%" margin={{ left: 30, right: 16, top: 6 }}>
                <CartesianGrid horizontal={false} stroke={C.grid} />
                <XAxis type="number" domain={[0, 35]} {...chartAxis} />
                <YAxis type="category" dataKey="name" width={150} {...chartAxis} />
                <Tooltip content={<ChartTip unit="%" />} cursor={{ fill: "rgba(40,80,104,0.06)" }} />
                <Legend verticalAlign="top" iconType="circle" />
                <Bar dataKey="weight" name="Weight (%)" fill={C.navy} isAnimationActive={false} cursor="pointer" onClick={(e: any) => setSel(e.key)}>
                  {data.map((x) => (<Cell key={x.key} fill={C.navy} opacity={sel && sel !== x.key ? 0.45 : 1} />))}
                </Bar>
                <Bar dataKey="ci" name="Confidence Range (±%)" fill={C.steel} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Source ml />
        </Panel>
        {cur && (
          <Panel className="mt-4" title={`${cur.label}: expert vs calibrated weight`}>
            <p className="text-sm text-navy">Expert starting weight <b>{cur.expertWeight}%</b> → calibrated <b>{cur.mlWeight}% ± {cur.confidencePm}</b>. {Math.abs(cur.expertWeight - cur.mlWeight) <= cur.confidencePm ? "The difference is within the confidence range, so the expert weight is statistically consistent with the data." : "The difference is outside the confidence range, so the data supports changing the expert weight."}</p>
          </Panel>
        )}
      </Page>
      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <Panel title="Expert vs calibrated weights">
          <table className="w-full text-sm">
            <thead className="text-xs text-navy/70"><tr><th className="py-2 text-left font-medium">Dimension</th><th className="py-2 text-right font-medium">Expert</th><th className="py-2 text-right font-medium">Calibrated</th></tr></thead>
            <tbody>{dims.map((x) => (<tr key={x.key} className="border-t border-steel/40"><td className="py-2 text-navy">{x.label}</td><td className="py-2 text-right text-navy">{x.expertWeight}%</td><td className="py-2 text-right font-medium text-navy">{x.mlWeight}%</td></tr>))}</tbody>
          </table>
          <h4 className="mt-5 text-sm font-medium text-navy">Deterioration-risk model ({risk.definition})</h4>
          <p className="mt-1 text-xs text-navy/70">Trained on {risk.trainedOn}; AUC {risk.auc}. Priority = Risk × Business Impact × Controllability.</p>
          <table className="mt-2 w-full text-sm"><tbody>{(modelOutputs.featureImportance as any[]).map((f) => (<tr key={f.feature} className="border-t border-steel/40"><td className="py-1.5 text-navy">{f.feature}</td><td className="py-1.5 text-right text-navy">{Math.round(f.importance * 100)}% of importance</td></tr>))}</tbody></table>
        </Panel>
        <Panel title={`Why ${d.name} scores ${d.health} (points vs sample average ${modelOutputs.baselineHealth})`}>
          <div className="h-[230px]" role="img" aria-label={`Bar chart of dimension contributions to ${d.name} health score`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shapData} layout="vertical" margin={{ left: 30, right: 16 }}>
                <CartesianGrid horizontal={false} stroke={C.grid} />
                <XAxis type="number" {...chartAxis} />
                <YAxis type="category" dataKey="name" width={150} {...chartAxis} />
                <Tooltip content={<ChartTip unit=" pts" />} />
                <Bar dataKey="value" name="Contribution" isAnimationActive={false}>{shapData.map((x) => (<Cell key={x.name} fill={x.value < 0 ? C.red : C.navy} />))}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-navy/70">Health {d.health}; 90-day deterioration risk {Math.round(d.risk * 100)}%. Contributions are exact for this linear score.</p>
          <Source ml />
        </Panel>
      </section>
    </>
  );
}
