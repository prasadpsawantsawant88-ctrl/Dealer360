"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, RotateCcw, Check, X, Loader2, Keyboard } from "lucide-react";
import { Page, Panel, Source } from "@/components/ui";
import { CoachTabs } from "@/components/CoachTabs";
import { useSelection } from "@/components/Selection";
import { getSalesperson, COMP_LABELS } from "@/lib/data";
import { BANKS, THEME_BANK } from "@/lib/coach";
import { analysePitch, highlightParts, PITCH_OBJECTIVES, type PitchResult } from "@/lib/pitchAnalysis";
import type { Comp } from "@/lib/types";

const MAX_SECONDS = 180;
const ATTEMPTS_KEY = "d360_pitch_attempts";
const FOCUS: Record<keyof Comp, (typeof PITCH_OBJECTIVES)[number]> = {
  productKnowledge: "Value communication", customerRapport: "Empathy", closingSkills: "Expectation management",
  objectionHandling: "Objection handling", followUp: "Expectation management",
};

type Phase = "idle" | "recording" | "review" | "result";
type AiNotes = { summary: string; strengths: string[]; improvements: { issue: string; why: string; tryInstead: string }[]; rewrite: string; drill: string };
type Ai = { state: "idle" | "loading" | "done" | "unavailable" | "error"; data?: AiNotes };

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function PitchTraining() {
  const { spId } = useSelection();
  const sp = getSalesperson(spId);
  const first = sp.name.split(" ")[0];
  const topTheme = Object.entries(sp.complaintThemes).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "delivery expectations";
  const [bankKey, setBankKey] = useState(THEME_BANK[topTheme] ?? "delivery");
  useEffect(() => { setBankKey(THEME_BANK[topTheme] ?? "delivery"); }, [topTheme, spId]);
  const bank = BANKS[bankKey];

  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [canTranscribe, setCanTranscribe] = useState(true);
  const [result, setResult] = useState<PitchResult | null>(null);
  const [analysed, setAnalysed] = useState("");
  const [ai, setAi] = useState<Ai>({ state: "idle" });
  const [attempts, setAttempts] = useState<number[]>([]);

  const recorder = useRef<MediaRecorder | null>(null);
  const speech = useRef<any>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(0);
  const active = useRef(false);
  const finalText = useRef("");
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    const w = window as any;
    setCanTranscribe(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    try { setAttempts(JSON.parse(sessionStorage.getItem(`${ATTEMPTS_KEY}_${spId}`) || "[]")); } catch { setAttempts([]); }
  }, [spId]);

  const release = useCallback(() => {
    active.current = false;
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    try { speech.current?.stop(); } catch {}
    speech.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);
  useEffect(() => () => { release(); if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, [release]);

  const clearAudio = () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); urlRef.current = null; setAudioUrl(null); };

  const reset = () => {
    release(); clearAudio();
    setPhase("idle"); setElapsed(0); setDuration(null); setTranscript(""); setInterim(""); setError("");
    setResult(null); setAnalysed(""); setAi({ state: "idle" }); finalText.current = "";
  };

  const stop = useCallback(() => {
    if (!active.current) return;
    const secs = (Date.now() - startedAt.current) / 1000;
    setDuration(Math.round(secs));
    try { if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop(); } catch {}
    release();
    setInterim("");
    setPhase("review");
  }, [release]);

  const start = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("This browser cannot record audio. Use the typing option below instead.");
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      clearAudio(); finalText.current = ""; setTranscript(""); setInterim(""); setResult(null); setAi({ state: "idle" });
      chunks.current = [];
      const rec = new MediaRecorder(s);
      rec.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      rec.onstop = () => {
        if (!chunks.current.length) return;
        const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob); urlRef.current = url; setAudioUrl(url);
      };
      rec.start(); recorder.current = rec;

      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const sr = new SR();
        sr.continuous = true; sr.interimResults = true; sr.lang = "en-IN";
        sr.onresult = (e: any) => {
          let live = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) finalText.current += r[0].transcript.trim() + " "; else live += r[0].transcript;
          }
          setTranscript(finalText.current); setInterim(live);
        };
        sr.onerror = (e: any) => {
          if (e.error === "not-allowed" || e.error === "service-not-allowed") setError("Speech-to-text was blocked. You can still type what you said after recording.");
          else if (e.error === "network") setError("Speech-to-text needs an internet connection. You can type what you said after recording.");
        };
        sr.onend = () => { if (active.current) { try { sr.start(); } catch {} } };
        sr.start(); speech.current = sr;
      }

      active.current = true; startedAt.current = Date.now(); setElapsed(0); setPhase("recording");
      timer.current = setInterval(() => {
        const t = (Date.now() - startedAt.current) / 1000;
        setElapsed(t);
        if (t >= MAX_SECONDS) stop();
      }, 250);
    } catch (e: any) {
      release();
      setError(e?.name === "NotAllowedError" ? "Microphone access was denied. Allow it in the browser's site settings, or use the typing option below." : e?.name === "NotFoundError" ? "No microphone was found. Use the typing option below." : "Could not start recording. Use the typing option below.");
    }
  };

  const typeInstead = () => { reset(); setPhase("review"); };

  const analyse = async () => {
    const text = transcript.trim();
    if (text.length < 5) return;
    const r = analysePitch(text, duration, bankKey);
    setResult(r); setAnalysed(text); setPhase("result");
    const next = [...attempts, r.overall].slice(-8);
    setAttempts(next);
    try { sessionStorage.setItem(`${ATTEMPTS_KEY}_${spId}`, JSON.stringify(next)); } catch {}

    if (text.length < 20) { setAi({ state: "idle" }); return; }
    setAi({ state: "loading" });
    try {
      const res = await fetch("/api/pitch-feedback", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          transcript: text,
          scenario: { title: bank.title, opening: bank.opening, context: bank.context },
          salesperson: { name: sp.name, role: sp.role, weakest: `${COMP_LABELS[sp.weakestCompetency]} (${sp.competencies[sp.weakestCompetency]})` },
          analysis: { scores: r.scores, wpm: r.metrics.wpm, seconds: duration },
        }),
      });
      if (res.status === 501) { setAi({ state: "unavailable" }); return; }
      if (!res.ok) { setAi({ state: "error" }); return; }
      setAi({ state: "done", data: await res.json() });
    } catch { setAi({ state: "error" }); }
  };

  const focus = FOCUS[sp.weakestCompetency];
  const prev = attempts.length > 1 ? attempts[attempts.length - 2] : null;

  return (
    <>
      <CoachTabs />
      <Page
        title={["AI Sales", "Coach", "Pitch Training"]}
        left={
          <div className="space-y-5">
            <p className="max-w-md text-sm leading-relaxed text-navy/85">
              Record {first}&apos;s answer to the customer on the right, out loud, as you would on the showroom floor. The coach turns it into text, scores it on the five coaching objectives and lists what to change first.
            </p>
            <label className="block text-xs text-navy/70">
              Scenario
              <select value={bankKey} disabled={phase === "recording"} onChange={(e) => { setBankKey(e.target.value); reset(); }} className="mt-1 block w-full max-w-xs rounded-sm border border-steel bg-white px-2 py-2 text-sm text-navy disabled:opacity-60">
                {Object.entries(BANKS).map(([k, b]) => (<option key={k} value={k}>{b.title}</option>))}
              </select>
            </label>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-navy">What a good answer covers</h3>
              <ul className="space-y-1.5 text-sm text-navy">
                {["Acknowledge the problem before you explain", "Ask what matters to the customer", "Give a specific date, number or fact", "Offer proof the customer can check", "End with a clear next step"].map((t) => (
                  <li key={t} className="flex gap-2"><span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-alert" />{t}</li>
                ))}
              </ul>
            </div>
            <p className="max-w-md border-l-2 border-steel pl-4 text-xs leading-relaxed text-navy/70">
              {first}&apos;s weakest competency on record is {COMP_LABELS[sp.weakestCompetency].toLowerCase()} ({sp.competencies[sp.weakestCompetency]}), so watch the <b>{focus}</b> score first.
            </p>
            {attempts.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-navy">Attempts this session</h3>
                <div className="flex flex-wrap items-end gap-2">
                  {attempts.map((a, i) => (<span key={i} className={`display rounded-sm border px-3 py-1 text-lg ${i === attempts.length - 1 ? "border-navy bg-navy text-white" : "border-steel bg-white text-navy"}`}>{a}</span>))}
                </div>
              </div>
            )}
          </div>
        }
      >
        <div className="space-y-5">
          <Panel title="Customer says">
            <blockquote className="display text-xl leading-snug text-navy">&ldquo;{bank.opening}&rdquo;</blockquote>
            <p className="mt-2 text-xs text-navy/70">{bank.context}</p>
          </Panel>

          {error && <p role="alert" className="rounded-sm border border-alert/40 bg-alert/5 p-3 text-sm text-alert">{error}</p>}

          {phase === "idle" && (
            <Panel title="Your pitch">
              <p className="mb-4 text-sm text-navy/85">Speak for 45 seconds to two minutes. Press the button when you are ready.</p>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={start} className="inline-flex items-center gap-2 rounded-sm bg-navy px-6 py-3 text-sm font-semibold tracking-wide text-white hover:bg-ink"><Mic size={16} /> START RECORDING</button>
                <button onClick={typeInstead} className="inline-flex items-center gap-2 rounded-sm border border-navy px-4 py-3 text-sm text-navy hover:bg-white"><Keyboard size={16} /> Type my pitch instead</button>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-navy/60">
                {canTranscribe ? "Chrome and Edge send the audio to their own speech service to produce the text." : "This browser cannot turn speech into text. You can record, then type what you said."} The recording itself stays in this tab and is never uploaded.
              </p>
            </Panel>
          )}

          {phase === "recording" && (
            <Panel title="Recording">
              <div role="status" className="flex items-center gap-3">
                <span aria-hidden className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-alert opacity-70" /><span className="relative inline-flex h-3 w-3 rounded-full bg-alert" /></span>
                <span className="display text-3xl text-navy">{fmtTime(elapsed)}</span>
                <span className="text-xs text-navy/60">of {fmtTime(MAX_SECONDS)} maximum</span>
              </div>
              <div className="mt-4 min-h-[88px] rounded-sm bg-paper p-3 text-sm leading-relaxed text-navy">
                {transcript || interim ? <>{transcript}<span className="text-navy/50">{interim}</span></> : <span className="text-navy/50">{canTranscribe ? "Listening. Your words will appear here." : "Recording audio. Text is not available in this browser; you can type it afterwards."}</span>}
              </div>
              <button onClick={stop} className="mt-4 inline-flex items-center gap-2 rounded-sm bg-alert px-6 py-3 text-sm font-semibold tracking-wide text-white hover:opacity-90"><Square size={14} /> STOP</button>
            </Panel>
          )}

          {phase === "review" && (
            <Panel title="Review before analysing">
              {audioUrl && (<div className="mb-4"><audio controls src={audioUrl} className="w-full" /><p className="mt-1 text-xs text-navy/60">Length {duration !== null ? fmtTime(duration) : "unknown"}. Listen back to check the tone.</p></div>)}
              <label className="block text-xs text-navy/70">
                Transcript (edit anything the speech recogniser got wrong)
                <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={7} placeholder="Type or paste the pitch here" className="mt-1 block w-full rounded-sm border border-steel bg-white p-3 text-sm leading-relaxed text-navy" />
              </label>
              {!transcript.trim() && audioUrl && <p className="mt-2 text-xs text-navy/70">No words were captured. Type what you said to get feedback.</p>}
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={analyse} disabled={transcript.trim().length < 5} className="rounded-sm bg-navy px-6 py-3 text-sm font-semibold tracking-wide text-white hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50">ANALYSE MY PITCH</button>
                <button onClick={reset} className="inline-flex items-center gap-2 rounded-sm border border-navy px-4 py-3 text-sm text-navy hover:bg-white"><RotateCcw size={14} /> Start over</button>
              </div>
            </Panel>
          )}

          {phase === "result" && result && (
            <>
              <Panel title="Pitch score">
                <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
                  <div className="flex items-end gap-3"><div className="display text-6xl text-navy">{result.overall}</div><div className="pb-2"><div className={`text-sm font-semibold ${result.band === "Needs work" ? "text-alert" : "text-navy"}`}>{result.band}</div><div className="text-xs text-navy/60">out of 100{prev !== null ? `, ${result.overall - prev >= 0 ? "+" : ""}${result.overall - prev} vs last attempt` : ""}</div></div></div>
                </div>
                {result.tooShort && <p className="mt-3 text-sm text-alert">Only {result.metrics.words} words were captured, which is too short for a reliable score.</p>}
                <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    ["Length", duration !== null ? fmtTime(duration) : "n/a"],
                    ["Words", `${result.metrics.words}`],
                    ["Pace", result.metrics.wpm !== null ? `${result.metrics.wpm} wpm` : "n/a"],
                    ["Filler words", `${result.metrics.fillerCount}`],
                  ].map(([k, v]) => (<div key={k}><dt className="text-xs text-navy/60">{k}</dt><dd className="display text-2xl text-navy">{v}</dd></div>))}
                </dl>
                <p className="mt-2 text-[11px] text-navy/60">Good pace is 120 to 160 words per minute. Speech recognition often drops &ldquo;um&rdquo; and &ldquo;uh&rdquo;, so the filler count can be low.</p>
              </Panel>

              <Panel title="Scores by coaching objective">
                <ul className="space-y-3">
                  {PITCH_OBJECTIVES.map((k) => (
                    <li key={k}>
                      <div className="mb-1 flex justify-between text-sm text-navy"><span>{k}{k === focus && <span className="ml-2 rounded-sm bg-steel/50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">focus area</span>}</span><b className={result.scores[k] < 60 ? "text-alert" : ""}>{result.scores[k]}</b></div>
                      <div className="h-2 rounded-full bg-steel/40"><div className={`h-2 rounded-full ${result.scores[k] < 60 ? "bg-alert" : "bg-navy"}`} style={{ width: `${result.scores[k]}%` }} /></div>
                    </li>
                  ))}
                </ul>
                <Source />
              </Panel>

              <Panel title="Checklist">
                <ul className="grid gap-2 sm:grid-cols-2">
                  {result.checklist.map((c) => (<li key={c.label} className="flex items-start gap-2 text-sm text-navy">{c.ok ? <Check size={16} className="mt-0.5 shrink-0 text-navy" aria-label="Done" /> : <X size={16} className="mt-0.5 shrink-0 text-alert" aria-label="Missing" />}<span className={c.ok ? "" : "text-navy/80"}>{c.label}</span></li>))}
                </ul>
              </Panel>

              {result.tips.length > 0 && (
                <Panel title="What to fix first">
                  <ol className="space-y-4">
                    {result.tips.map((t, i) => (
                      <li key={i} className="flex gap-3">
                        <span className={`display w-6 shrink-0 text-xl ${t.severity === "high" ? "text-alert" : "text-navy"}`}>{i + 1}</span>
                        <div className="text-sm text-navy">
                          <p><b>{t.area}.</b> {t.issue}</p>
                          <p className="mt-1 text-navy/85">{t.suggestion}</p>
                          {t.example && <p className="mt-2 rounded-sm bg-paper p-2 text-xs italic text-navy">Try saying: &ldquo;{t.example}&rdquo;</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </Panel>
              )}

              {result.strengths.length > 0 && (
                <Panel title="What worked">
                  <ul className="space-y-1.5 text-sm text-navy">{result.strengths.map((s) => (<li key={s} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0" />{s}</li>))}</ul>
                </Panel>
              )}

              <Panel title="Your words, flagged">
                <p className="text-sm leading-relaxed text-navy">
                  {highlightParts(analysed, result.flags).map((p, i) => p.kind ? (
                    <mark key={i} className={`rounded-sm px-0.5 ${p.kind === "filler" ? "bg-steel/60 text-ink" : p.kind === "vague" ? "bg-transparent text-ink underline decoration-alert decoration-wavy" : "bg-alert/15 text-alert"}`}>{p.text}</mark>
                  ) : (<span key={i}>{p.text}</span>))}
                </p>
                <p className="mt-3 text-[11px] text-navy/60">Grey: filler words. Red: blame or pressure phrases. Wavy underline: vague wording.</p>
              </Panel>

              <Panel title="Written coaching from Claude">
                {ai.state === "loading" && <p className="flex items-center gap-2 text-sm text-navy"><Loader2 size={16} className="animate-spin" /> Reading your pitch...</p>}
                {ai.state === "unavailable" && <p className="text-sm text-navy/80">Not switched on. Add an <code className="rounded bg-paper px-1">ANTHROPIC_API_KEY</code> to <code className="rounded bg-paper px-1">.env.local</code> and restart to get a written review and a rewritten pitch here. The scores above work without it.</p>}
                {ai.state === "error" && <p className="text-sm text-alert">The written review could not be fetched. The scores above are still valid.</p>}
                {ai.state === "idle" && <p className="text-sm text-navy/80">Add a little more to the transcript to get a written review.</p>}
                {ai.state === "done" && ai.data && (
                  <div className="space-y-4 text-sm text-navy">
                    <p className="leading-relaxed">{ai.data.summary}</p>
                    {ai.data.strengths.length > 0 && (<div><h4 className="mb-1 font-semibold">Strengths</h4><ul className="list-disc space-y-1 pl-5">{ai.data.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></div>)}
                    {ai.data.improvements.length > 0 && (
                      <div><h4 className="mb-2 font-semibold">Improve</h4>
                        <ol className="space-y-3">{ai.data.improvements.map((m, i) => (
                          <li key={i} className="rounded-sm border border-steel/60 p-3"><p><b>{m.issue}</b></p><p className="mt-1 text-navy/85">{m.why}</p><p className="mt-2 rounded-sm bg-paper p-2 text-xs italic">Try saying: &ldquo;{m.tryInstead}&rdquo;</p></li>
                        ))}</ol>
                      </div>
                    )}
                    {ai.data.rewrite && (<div><h4 className="mb-1 font-semibold">A stronger version</h4><p className="rounded-sm bg-paper p-3 leading-relaxed">{ai.data.rewrite}</p></div>)}
                    {ai.data.drill && (<div><h4 className="mb-1 font-semibold">Five-minute drill</h4><p>{ai.data.drill}</p></div>)}
                  </div>
                )}
              </Panel>

              <div className="flex flex-wrap gap-3">
                <button onClick={reset} className="inline-flex items-center gap-2 rounded-sm bg-navy px-5 py-2.5 text-sm text-white hover:bg-ink"><Mic size={15} /> Record another attempt</button>
                <button onClick={() => setPhase("review")} className="rounded-sm border border-navy px-4 py-2.5 text-sm text-navy hover:bg-white">Edit transcript and re-score</button>
              </div>
            </>
          )}
        </div>
      </Page>
    </>
  );
}
