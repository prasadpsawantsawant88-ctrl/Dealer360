"use client";
import { Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Page, Kpi, Panel, Source, ChartTip, chartAxis } from "@/components/ui";
import { CoachTabs } from "@/components/CoachTabs";
import { useSelection } from "@/components/Selection";
import { C } from "@/lib/theme";
import { getSalesperson } from "@/lib/data";
import pitchJson from "@/data/pitch_sessions.json";
import type { PitchSession } from "@/lib/types";

const pitch = pitchJson as unknown as Record<string, PitchSession>;

export default function Impact() {
  const { spId } = useSelection();
  const sp = getSalesperson(spId); const p = pitch[spId];
  const data = p.attempts.map((v, i) => ({ attempt: `Attempt ${i + 1}`, score: v, gain: v - p.attempts[0] }));
  const colors = [C.steel, C.navySoft, C.navy, C.navy, C.navy];
  const max = Math.max(10, Math.ceil((p.liftPts + 2) / 5) * 5);
  return (
    <>
      <CoachTabs />
      <Page
        title={["Coaching", "Impact"]}
        left={
          <div className="space-y-8">
            <div className="flex gap-12"><Kpi value={`+${p.liftPts} pts`} label="Confidence Lift" /><Kpi value={`${p.themeCoveragePct}%`} label="Theme Coverage" /></div>
            <p className="max-w-md text-sm leading-relaxed text-navy/85">Simulated practice for {sp.name}: average pitch score moves from {p.attempts[0]} to {p.attempts[4]} over five sessions, with the biggest early gains on {sp.name.split(" ")[0]}&apos;s weakest skills.</p>
            <p className="max-w-md text-sm leading-relaxed text-navy/85">Theme coverage is the share of {sp.name.split(" ")[0]}&apos;s named complaints that fall in the three most frequent themes, which the practice scenarios target. Raising the two weakest competencies by 70% of the pitch gain lifts conversion from {p.conversionBefore}% to {p.conversionAfter}% ({p.conversionLiftPct >= 0 ? "+" : ""}{p.conversionLiftPct}% relative). This feeds Outcome Tracking.</p>
          </div>
        }
      >
        <Panel title="Coaching Impact — Practice Improvement">
          <div className="h-[380px]" role="img" aria-label="Combo chart of pitch score by practice attempt with improvement trajectory">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ left: -6, right: 6, top: 18 }}>
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="attempt" {...chartAxis} />
                <YAxis yAxisId="l" domain={[0, 100]} {...chartAxis} />
                <YAxis yAxisId="r" orientation="right" domain={[0, max]} {...chartAxis} />
                <Tooltip content={<ChartTip />} />
                <Legend verticalAlign="top" iconType="circle" />
                <Bar yAxisId="l" dataKey="score" name="Pitch score" barSize={56} isAnimationActive={false} label={{ position: "top", fill: C.navy, fontSize: 12, fontWeight: 600 }}>
                  {data.map((x, i) => (<Cell key={x.attempt} fill={colors[i]} />))}
                </Bar>
                <Line yAxisId="r" dataKey="gain" name="Gain vs attempt 1 (pts)" stroke={C.red} strokeWidth={2.5} dot={{ r: 4, fill: C.red }} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <Source />
        </Panel>
      </Page>
    </>
  );
}
