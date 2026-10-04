"use client";
import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Page, Kpi, Panel, Source, ChartTip, chartAxis } from "@/components/ui";
import { CoachTabs } from "@/components/CoachTabs";
import { useSelection } from "@/components/Selection";
import { C } from "@/lib/theme";
import { SESSION_KEY, Session } from "@/lib/coach";
import { getSalesperson, COMP_LABELS } from "@/lib/data";
import pitchJson from "@/data/pitch_sessions.json";
import type { PitchSession } from "@/lib/types";

const pitch = pitchJson as unknown as Record<string, PitchSession>;

export default function Analysis() {
  const { spId } = useSelection();
  const sp = getSalesperson(spId); const p = pitch[spId];
  const [sel, setSel] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => { try { const s = sessionStorage.getItem(SESSION_KEY); if (s) { const j = JSON.parse(s); setSession(j.spId === spId ? j : null); } } catch {} setSel(0); }, [spId]);
  const data = p.scores.map((v, i) => ({ minute: i + 1, recorded: v, practice: session?.scores[i] }));
  const d = p.drops[Math.min(sel, p.drops.length - 1)];
  const avgDrop = p.drops.length ? Math.round(p.drops.reduce((a, b) => a + (b.from - b.to), 0) / p.drops.length) : 0;
  const first = sp.name.split(" ")[0];
  return (
    <>
      <CoachTabs />
      <Page
        title={["AI Sales Coach", "Analysis"]}
        lede={`Timestamped pitch scoring for ${sp.name} identifies the exact moments where engagement dropped. Each minute of the recorded pitch tests one skill; scores follow that skill's competency plus carry-over from the previous minute.`}
        left={
          <div className="space-y-6">
            <div className="flex gap-10"><Kpi value={p.drops.length} label="Score Drop Moments" /><Kpi value={p.drops.length ? `−${avgDrop}pts` : "none"} label="Avg. Impact" /></div>
            {d ? (
              <>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-navy">Select a drop</h3>
                  <div className="flex flex-wrap gap-2">{p.drops.map((x, i) => (<button key={x.minute} onClick={() => setSel(i)} aria-pressed={sel === i} className={`rounded-sm border px-3 py-1.5 text-xs ${sel === i ? "border-alert bg-alert text-white" : "border-steel bg-white text-navy hover:border-navy"}`}>Minute {x.minute}: −{x.from - x.to}</button>))}</div>
                </div>
                <Panel>
                  <p className="text-sm font-semibold text-navy">{d.skill} score dropped {d.subFrom} → {d.subTo} at minute {d.minute} (overall pitch {d.from} → {d.to}).</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-navy/90">{d.why.map((w) => <li key={w}>{w}</li>)}</ul>
                  <p className="mt-3 text-xs text-navy/70">Recommendation: practise {d.skill.toLowerCase()} in the scenario tab; {first}&apos;s weakest competency is {COMP_LABELS[sp.weakestCompetency].toLowerCase()} ({sp.competencies[sp.weakestCompetency]}).</p>
                </Panel>
              </>
            ) : (<Panel><p className="text-sm text-navy">No minute dropped by 8 points or more in {first}&apos;s recorded pitch, so no coaching moments were flagged. Lowest score: {Math.min(...p.scores)}.</p></Panel>)}
          </div>
        }
      >
        <Panel>
          <div className="h-[400px]" role="img" aria-label="Line chart of pitch score by minute with score drops marked">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 16 }}>
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="minute" {...chartAxis} label={{ value: "Minute", position: "insideBottom", offset: -8, fill: C.navy, fontSize: 12 }} />
                <YAxis domain={[0, 100]} {...chartAxis} label={{ value: "Pitch Score (0-100)", angle: -90, position: "insideLeft", fill: C.navy, fontSize: 12 }} />
                <Tooltip content={<ChartTip />} />
                {session && <Legend verticalAlign="top" iconType="circle" />}
                <Line dataKey="recorded" name={`Recorded pitch (${first})`} stroke={C.navy} strokeWidth={2.5} dot={{ r: 4, fill: C.navy }} isAnimationActive={false} />
                {session && <Line dataKey="practice" name="Your practice session" stroke={C.red} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 4, fill: C.red }} isAnimationActive={false} />}
                {p.drops.map((x, i) => (<ReferenceDot key={x.minute} x={x.minute} y={x.to} r={i === sel ? 9 : 6} fill={C.red} stroke="#fff" strokeWidth={2} onClick={() => setSel(i)} style={{ cursor: "pointer" }} />))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Source />
          {!session && <p className="mt-1 text-center text-xs text-navy/70">Complete a practice session in the Scenario tab to overlay your own scores.</p>}
        </Panel>
      </Page>
    </>
  );
}
