"use client";
import { useState } from "react";
import Link from "next/link";
import { Page, KpiBullet, Panel } from "@/components/ui";
import { CoachTabs } from "@/components/CoachTabs";
import { OBJECTIVES, BANKS, THEME_BANK, SESSION_KEY, Session } from "@/lib/coach";
import { useSelection } from "@/components/Selection";
import { getSalesperson, getDealer } from "@/lib/data";
import { Play } from "lucide-react";

function Showroom() {
  return (
    <svg viewBox="0 0 640 200" role="img" aria-label="Illustration of a dealership showroom with two sales staff and a customer" className="w-full rounded-xl bg-white">
      <rect width="640" height="200" fill="#F2F4F7" />
      <rect y="150" width="640" height="50" fill="#E3E8EE" />
      <rect x="40" y="30" width="170" height="80" fill="#fff" stroke="#C0C8D0" />
      <path d="M390 150 q10-50 70-56 h90 q40 4 62 40 l8 16 z" fill="#285068" />
      <circle cx="440" cy="152" r="16" fill="#14202B" /><circle cx="560" cy="152" r="16" fill="#14202B" />
      {[[240, "#285068"], [310, "#14202B"], [150, "#14202B"]].map(([x, c], i) => (
        <g key={i}><circle cx={x as number} cy="86" r="16" fill="#C0C8D0" /><rect x={(x as number) - 22} y="104" width="44" height="64" rx="12" fill={c as string} /></g>
      ))}
      <circle cx="600" cy="30" r="12" fill="#D83038" />
    </svg>
  );
}

export default function Coach() {
  const { spId } = useSelection();
  const sp = getSalesperson(spId);
  const themes = Object.entries(sp.complaintThemes).sort((a, b) => b[1] - a[1]);
  const topTheme = themes[0]?.[0] ?? "delivery expectations";
  const bankKey = THEME_BANK[topTheme] ?? "delivery";
  const bank = BANKS[bankKey];
  const TURNS = bank.turns;
  const first = sp.name.split(" ")[0];
  const [started, setStarted] = useState(false);
  const [turn, setTurn] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [done, setDone] = useState<Session | null>(null);

  const choose = (i: number) => {
    const np = [...picks, i];
    if (np.length === TURNS.length) {
      const scores = np.map((p, t) => TURNS[t].options[p].score);
      const s: Session = { spId, bank: bankKey, scores, picks: np, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) };
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
      setDone(s); setPicks(np);
    } else { setPicks(np); setTurn(turn + 1); }
  };
  const reset = () => { setStarted(true); setTurn(0); setPicks([]); setDone(null); };

  return (
    <>
      <CoachTabs />
      <Page
        title={["AI Sales", "Coach", "Scenario"]}
        left={
          <div className="space-y-5">
            <ul className="space-y-2 border-l border-steel pl-5"><KpiBullet>Personalized Practice Mode</KpiBullet><KpiBullet>Complaint-Informed Scenario</KpiBullet></ul>
            <p className="max-w-md text-sm leading-relaxed text-navy/85">{first}&apos;s scenario is chosen from the complaint themes named against {sp.name.split(" ")[0]}: {themes.slice(0, 3).map(([t, n]) => `${t} (${n})`).join(", ") || "none recorded"}. Scenario: {bank.title.toLowerCase()}. Practice objective: demonstrate consultative selling with a customer who is already unhappy.</p>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-navy">Coaching objectives</h3>
              <div className="flex flex-wrap gap-2">{OBJECTIVES.map((o) => (<span key={o} className="rounded-full border border-steel bg-white px-3 py-1 text-xs text-navy">{o}</span>))}</div>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          <Showroom />
          <Panel title="Customer scenario">
            <blockquote className="display text-xl leading-snug text-navy">&ldquo;{bank.opening}&rdquo;</blockquote>
            <p className="mt-2 text-xs text-navy/70">{bank.context}</p>
            {!started && (
              <button onClick={reset} className="mt-5 inline-flex items-center gap-2 rounded-sm bg-navy px-6 py-3 text-sm font-semibold tracking-wide text-white hover:bg-ink"><Play size={14} /> START PRACTICE</button>
            )}
          </Panel>

          {started && !done && (
            <Panel title={`Exchange ${turn + 1} of ${TURNS.length} · ${TURNS[turn].objective}`}>
              <p className="rounded-sm bg-paper p-3 text-sm italic text-navy">Customer: &ldquo;{TURNS[turn].customer}&rdquo;</p>
              <p className="mb-2 mt-4 text-xs text-navy/70">Choose how {first} replies:</p>
              <div className="space-y-2">
                {TURNS[turn].options.map((o, i) => (
                  <button key={o.text} onClick={() => choose(i)} className="w-full rounded-sm border border-steel bg-white p-3 text-left text-sm text-navy transition-colors hover:border-navy hover:bg-paper">{o.text}</button>
                ))}
              </div>
            </Panel>
          )}

          {done && (
            <Panel title="Practice complete">
              <div className="flex items-end gap-4"><div className="display text-6xl text-navy">{done.avg}</div><div className="pb-2 text-sm text-navy">average pitch score (0–100)</div></div>
              <ul className="mt-4 space-y-2 text-sm text-navy">
                {done.picks.map((p, t) => (<li key={t} className="flex gap-3"><span className={`display w-8 text-lg ${done.scores[t] < 65 ? "text-alert" : "text-navy"}`}>{done.scores[t]}</span><span>{TURNS[t].objective}: {TURNS[t].options[p].note}</span></li>))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/coach/analysis" className="rounded-sm bg-navy px-4 py-2 text-sm text-white hover:bg-ink">View pitch analysis</Link>
                <button onClick={reset} className="rounded-sm border border-navy px-4 py-2 text-sm text-navy hover:bg-white">Retry scenario</button>
              </div>
            </Panel>
          )}
        </div>
      </Page>
    </>
  );
}
