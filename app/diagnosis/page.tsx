"use client";
import { useState } from "react";
import Link from "next/link";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Legend } from "recharts";
import { Panel, Source, ChartTip, chartAxis, Title, Callout } from "@/components/ui";
import { DealerPicker, useSelection } from "@/components/Selection";
import { C } from "@/lib/theme";
import { getDealer } from "@/lib/data";
import diagJson from "@/data/insights_diagnosis.json";
import { ChevronDown } from "lucide-react";

const diag = diagJson as unknown as Record<string, any>;
const FW = ["5 Whys", "Fishbone", "Pareto", "Sales Funnel", "Competency Gap", "Customer Journey", "Working Capital", "McKinsey 7S"] as const;
type F = (typeof FW)[number];

export default function Diagnosis() {
  const { queuedId } = useSelection();
  const d = getDealer(queuedId); const x = diag[queuedId];
  const [step, setStep] = useState(5);
  const [fw, setFw] = useState<F>("5 Whys");
  return (
    <>
      <div className="max-w-3xl"><Title lines={["Diagnosis", "Engine"]} /><p className="mt-6 max-w-xl text-[15px] leading-relaxed text-navy/85">Health signals trigger automated root-cause analysis. Low CSI, high complaint volume and inventory ageing converge to separate systemic issues from isolated incidents. Management frameworks (5 Whys, Fishbone, Pareto and more) are populated from the dealer&apos;s own simulated data. For {d.name}, {x.salesProcessShare}% of complaints trace to sales-process gaps.</p></div>
      <div className="mt-6"><DealerPicker /></div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Panel title="Evidence chain (select a step)">
          <ol className="space-y-1">
            {(x.chain as any[]).map((c, i) => (
              <li key={c.t}>
                <button onClick={() => setStep(i)} aria-pressed={step === i} className={`w-full rounded-sm border px-4 py-2.5 text-left text-sm transition-colors ${step === i ? "border-alert bg-alert/5 text-navy" : "border-steel/70 bg-white text-navy hover:border-navy"}`}>{c.t}</button>
                {step === i && <p className="page-fade mx-1 mt-1 border-l-2 border-alert pl-3 text-xs leading-relaxed text-navy/85">{c.e}</p>}
                {i < x.chain.length - 1 && <ChevronDown size={14} className="mx-auto my-0.5 text-steel" aria-hidden />}
              </li>
            ))}
          </ol>
        </Panel>
        <div>
          <div className="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="Diagnostic frameworks">
            {FW.map((f) => (<button key={f} role="tab" aria-selected={fw === f} onClick={() => setFw(f)} className={`rounded-sm border px-3 py-1.5 text-xs transition-colors ${fw === f ? "border-navy bg-navy text-white" : "border-steel bg-white text-navy hover:border-navy"}`}>{f}</button>))}
          </div>
          <Panel title={`${fw} — ${d.name}`}>
            {fw === "5 Whys" && (<ol className="space-y-3">{(x.whys as string[]).map((w, i) => (<li key={w} className="flex gap-3 text-sm text-navy"><span className="display w-6 text-xl text-alert">{i + 1}</span>{w}</li>))}</ol>)}
            {fw === "Fishbone" && (<div className="grid gap-3 sm:grid-cols-2">{(x.fishbone as any[]).map(([cat, items]) => (<div key={cat} className="border-l-2 border-navy pl-3"><div className="text-sm font-semibold text-navy">{cat}</div><ul className="mt-1 list-disc pl-4 text-xs text-navy/85">{(items as string[]).map((i) => <li key={i}>{i}</li>)}</ul></div>))}</div>)}
            {fw === "Pareto" && (<div className="h-[280px]" role="img" aria-label="Pareto chart of complaint root-cause groups"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={x.pareto} margin={{ left: -10 }}><CartesianGrid vertical={false} stroke={C.grid} /><XAxis dataKey="n" {...chartAxis} interval={0} tick={{ fill: C.navy, fontSize: 11 }} /><YAxis {...chartAxis} unit="%" domain={[0, 100]} /><Tooltip content={<ChartTip unit="%" />} /><Legend verticalAlign="top" iconType="circle" /><Bar dataKey="v" name="Share of complaints" fill={C.navy} isAnimationActive={false} /><Line dataKey="cum" name="Cumulative" stroke={C.red} strokeWidth={2.5} dot={{ r: 3, fill: C.red }} isAnimationActive={false} /></ComposedChart></ResponsiveContainer></div>)}
            {fw === "Sales Funnel" && (<div className="h-[280px]" role="img" aria-label="Sales funnel versus regional benchmark"><ResponsiveContainer width="100%" height="100%"><BarChart data={x.funnel} margin={{ left: -10 }}><CartesianGrid vertical={false} stroke={C.grid} /><XAxis dataKey="n" {...chartAxis} /><YAxis {...chartAxis} /><Tooltip content={<ChartTip />} /><Legend verticalAlign="top" iconType="circle" /><Bar dataKey="dealer" name={`${d.name} (per 100 leads)`} fill={C.navy} isAnimationActive={false} /><Bar dataKey="bench" name="Regional median" fill={C.steel} isAnimationActive={false} /></BarChart></ResponsiveContainer></div>)}
            {fw === "Competency Gap" && (<div className="h-[280px]" role="img" aria-label="Team competency versus network average"><ResponsiveContainer width="100%" height="100%"><BarChart data={x.gap} layout="vertical" margin={{ left: 30 }}><CartesianGrid horizontal={false} stroke={C.grid} /><XAxis type="number" domain={[0, 100]} {...chartAxis} /><YAxis type="category" dataKey="n" width={140} {...chartAxis} /><Tooltip content={<ChartTip />} /><Legend verticalAlign="top" iconType="circle" /><Bar dataKey="you" name="Dealer team average" fill={C.red} isAnimationActive={false} /><Bar dataKey="bench" name="Network average" fill={C.steel} isAnimationActive={false} /></BarChart></ResponsiveContainer></div>)}
            {fw === "Customer Journey" && (<div className="h-[260px]" role="img" aria-label="Complaints by customer journey stage"><ResponsiveContainer width="100%" height="100%"><BarChart data={x.journey} margin={{ left: -10 }}><CartesianGrid vertical={false} stroke={C.grid} /><XAxis dataKey="n" {...chartAxis} /><YAxis {...chartAxis} unit="%" /><Tooltip content={<ChartTip unit="%" />} /><Bar dataKey="v" name="Share of complaints" fill={C.navy} isAnimationActive={false} /></BarChart></ResponsiveContainer></div>)}
            {fw === "Working Capital" && (<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{(x.workingCapital as any[]).map((k) => (<div key={k.k}><div className="display text-3xl text-alert">{k.v}</div><div className="text-sm text-navy">{k.k}</div><div className="text-xs text-navy/60">{k.s}</div></div>))}</div>)}
            {fw === "McKinsey 7S" && (<div className="grid gap-2 sm:grid-cols-2">{(x.sevenS as any[]).map(([k, v]) => (<div key={k} className="border-l-2 border-steel pl-3"><div className="text-sm font-semibold text-navy">{k}</div><div className="text-xs text-navy/85">{v}</div></div>))}</div>)}
            <Source />
          </Panel>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4"><Callout>Root cause: {x.topTheme} ({x.salesProcessShare}% of complaints are sales-process related). Next: review the complaints behind it.</Callout><Link href="/complaints" className="rounded-sm bg-navy px-4 py-2 text-sm text-white hover:bg-ink">Review complaint intelligence</Link></div>
    </>
  );
}
