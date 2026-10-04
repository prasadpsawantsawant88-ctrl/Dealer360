"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { Page, Kpi, KpiBullet, Panel, Source, Callout, ChartTip } from "@/components/ui";
import { C } from "@/lib/theme";
import { COMP_LABELS, dealers, getDealer, getSalesperson, salespeople, median } from "@/lib/data";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useSelection } from "@/components/Selection";

export function SalespersonView({ id }: { id: string }) {
  const s = getSalesperson(id);
  const router = useRouter();
  const sel = useSelection();
  useEffect(() => { if (sel.spId !== s.id) sel.setSp(s.id); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.id]);
  const dealer = getDealer(s.dealerId);
  const team = salespeople.filter((x) => x.dealerId === s.dealerId);
  const avgConv = dealer.kpis.conversionPct;
  const keys = Object.keys(COMP_LABELS) as (keyof typeof s.competencies)[];
  const radar = keys.map((k) => ({
    k: COMP_LABELS[k], you: s.competencies[k],
    avg: Math.round(team.reduce((a, b) => a + b.competencies[k], 0) / team.length),
    gap: Math.max(0, Math.round(team.reduce((a, b) => a + b.competencies[k], 0) / team.length) - s.competencies[k]),
  }));
  const first = s.name.split(" ")[0];
  const weak = COMP_LABELS[s.weakestCompetency];
  const themes = Object.entries(s.complaintThemes).sort((a, b) => b[1] - a[1]);
  const initials = s.name.split(" ").map((p) => p[0]).join("");
  return (
    <Page
      title={["Salesperson", "Profile"]}
      left={
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div aria-hidden className="flex h-20 w-20 items-center justify-center rounded-xl bg-navy text-2xl font-light text-white">{initials}</div>
            <div><div className="display text-2xl text-navy">{s.name}</div><div className="text-sm text-navy/70">{s.role} · {dealer.name}</div></div>
          </div>
          <ul className="space-y-2"><KpiBullet>{s.conversionPct}% Conversion Rate</KpiBullet></ul>
          <div className="flex flex-wrap gap-8">
            <Kpi small tone="navy" value={`${avgConv.toFixed(1)}%`} label="Dealer average" />
            <Kpi small value={`${s.complaintIncidenceVsPeer}×`} label="Complaint incidence vs peer median" />
          </div>
          <p className="max-w-md text-sm leading-relaxed text-navy/85">
            {first} scores {s.competencies.productKnowledge} on product knowledge but {s.competencies[s.weakestCompetency]} on {weak.toLowerCase()}. The {s.conversionPct}% conversion rate {s.conversionPct < avgConv ? "trails" : "meets"} the dealer average of {avgConv.toFixed(1)}%.
            {themes.length > 0 && ` Most frequent complaint theme: ${themes[0][0]} (${themes[0][1]} of ${s.complaintCount}).`}
          </p>
          {s.flaggedForCoaching ? <Callout>Priority coaching focus: negotiation skills and customer empathy training recommended</Callout> : <p className="text-sm text-navy">Not flagged for coaching: complaint incidence is within the normal range.</p>}
          <p className="max-w-md text-xs text-navy/60">Complaints are attributed only where {first} is named on the record. Dealer-level complaints are never assigned to individuals.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/coach" className="group inline-flex items-center gap-2 rounded-sm bg-alert px-4 py-2 text-sm font-medium text-white hover:bg-ink">Launch AI Sales Coach <ArrowRight size={16} /></Link>
            <select aria-label="Switch salesperson" className="rounded-sm border border-steel bg-white px-2 py-2 text-sm text-navy" value={s.id} onChange={(e) => router.push(`/salespeople/${e.target.value}`)}>
              {team.map((x) => (<option key={x.id} value={x.id}>{x.name}</option>))}
            </select>
          </div>
        </div>
      }
    >
      <Panel>
        <div className="h-[420px]" role="img" aria-label={`Radar chart comparing ${s.name} to the dealer average across five competencies`}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radar} outerRadius="72%">
              <PolarGrid stroke={C.steel} strokeDasharray="4 4" />
              <PolarAngleAxis dataKey="k" tick={{ fill: C.navy, fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: C.navy, fontSize: 10 }} axisLine={false} />
              <Tooltip content={<ChartTip />} />
              <Legend verticalAlign="top" iconType="circle" />
              <Radar name={`${first} Score (%)`} dataKey="you" stroke={C.navy} fill={C.navy} fillOpacity={0.55} isAnimationActive={false} />
              <Radar name="Dealer Average (%)" dataKey="avg" stroke={C.red} fill={C.red} fillOpacity={0.3} isAnimationActive={false} />
              <Radar name="Gap to Benchmark (%)" dataKey="gap" stroke={C.steel} fill={C.steel} fillOpacity={0.7} isAnimationActive={false} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <Source />
      </Panel>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[["Sales (12 mo)", `${s.unitsSold12m} units`], ["Training (12 mo)", `${s.trainingHours12m} hrs`], ["Complaints named", `${s.complaintCount}`]].map(([k, v]) => (
          <Panel key={k}><div className="display text-2xl text-navy">{v}</div><div className="text-xs text-navy/70">{k}</div></Panel>
        ))}
      </div>
    </Page>
  );
}
