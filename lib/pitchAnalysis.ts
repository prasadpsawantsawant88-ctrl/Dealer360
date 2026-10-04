import { BANKS } from "@/lib/coach";

/**
 * Rule-based pitch analysis. It runs in the browser, needs no API key and gives
 * the same result for the same transcript. It scores the five coaching
 * objectives already used by the practice scenarios, then adds delivery checks
 * (pace, filler words, length).
 */

export const PITCH_OBJECTIVES = ["Empathy", "Needs discovery", "Objection handling", "Expectation management", "Value communication"] as const;
export type PitchObjective = (typeof PITCH_OBJECTIVES)[number];

export type Tip = { area: string; severity: "high" | "medium" | "low"; issue: string; suggestion: string; example?: string };
export type Flag = { term: string; kind: "filler" | "risky" | "blame" | "vague" };
export type PitchResult = {
  overall: number;
  band: "Needs work" | "Solid" | "Strong";
  scores: Record<PitchObjective, number>;
  metrics: { words: number; seconds: number | null; wpm: number | null; fillerCount: number; fillerPer100: number; questions: number };
  checklist: { label: string; ok: boolean }[];
  strengths: string[];
  tips: Tip[];
  flags: Flag[];
  tooShort: boolean;
};

const FILLERS = ["um", "uh", "uhm", "erm", "hmm", "you know", "basically", "actually", "literally", "kind of", "sort of", "i mean"];
const RISKY = ["trust me", "to be honest", "believe me", "i promise", "guarantee", "guaranteed", "definitely", "100 percent", "for sure", "don't worry", "do not worry", "no problem at all", "best in class", "best in the class", "sign today", "only today", "today only", "limited time", "last unit", "everyone buys", "most people regret", "poor quality", "expires today"];
const BLAME = ["not our fault", "supplier's fault", "supplier fault", "their fault", "whoever told you", "nothing i can do", "company policy", "those are the rules", "that's how it is"];
const VAGUE = ["maybe", "hopefully", "i will try", "i'll try", "try my best", "should be around", "give or take", "something like", "as soon as possible", "asap", "probably", "i guess"];
const EMPATHY = ["i understand", "i'm sorry", "i am sorry", "sorry", "apologise", "apologize", "appreciate", "thank you for", "thanks for", "i hear you", "that makes sense", "i can see", "frustrating", "upsetting", "i get that", "must be"];
const GREETING = ["good morning", "good afternoon", "good evening", "hello", "welcome", "namaste", "hi"];
const QUESTION_PHRASES = ["do you", "would you", "can you tell me", "could you tell me", "tell me", "what matters", "what is important", "what's important", "what are you", "how often", "how many", "how long", "how do you", "which one", "which day", "what do you", "are you looking", "have you", "what kind", "what would", "what is your", "what's your", "may i ask"];
const USAGE = ["commute", "daily", "family", "budget", "home charging", "weekend", "highway", "city", "kilometres", "kilometers"];
const ACK = ["that is fair", "that's fair", "fair point", "fair enough", "reasonable", "common worry", "common concern", "good question", "i understand", "i hear you", "makes sense", "right to ask", "valid"];
const EVIDENCE = ["warranty", "in writing", "written", "show you", "spec sheet", "brochure", "report", "owner", "reference", "record", "document", "price breakup", "breakup", "calculation", "calculate", "compare", "comparison"];
const PRESSURE = ["competitors", "other dealers", "lose the booking", "you will lose", "offer expires", "expires today"];
const DATE_TERMS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december", "tomorrow", "next week", "this week", "this month", "end of day", "by evening", "hours", "days", "weeks"];
const FOLLOW = ["i will message", "i'll message", "i will call", "i'll call", "i will send", "i'll send", "i will update", "i'll update", "update you", "status update", "keep you posted", "follow up", "send you", "email you", "whatsapp", "message you", "call you", "confirm"];
const NEXT_STEP = ["next step", "test drive", "book", "schedule", "visit", "come by", "come in", "this week", "tomorrow", "appointment", "slot", "shall we", "would you like me to", "paperwork", "booking", "i will send", "i'll send", "i will call", "i'll call", "i will message", "i'll message"];
const VALUE = ["compare", "comparison", "cost", "running cost", "pays back", "payback", "worth", "per month", "per km", "saving", "savings", "save", "for your", "daily", "commute", "emi", "resale", "maintenance", "total cost", "per year"];
const LINKS = ["which means", "so that", "so you", "that means", "for you", "in your case", "for your", "because you", "since you", "based on what you"];
const HYPE = ["best", "amazing", "unbeatable", "fantastic", "number one", "simply better", "far better", "superb", "awesome", "incredible"];
const PRODUCT = ["warranty", "range", "battery", "charging", "charger", "variant", "features", "safety", "airbag", "airbags", "boot", "engine", "torque", "mileage", "kmpl", "service interval", "insurance", "registration", "on-road", "ex-showroom", "specification"];

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalise = (t: string) => t.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, " ").trim();
const matcher = (list: string[]) => new RegExp(`\\b(${[...list].sort((a, b) => b.length - a.length).map(esc).join("|")})\\b`, "gi");
const find = (text: string, list: string[]) => text.match(matcher(list)) ?? [];
const clamp = (n: number) => Math.max(15, Math.min(98, Math.round(n)));
const uniq = <T,>(a: T[]) => [...new Set(a)];

export function analysePitch(rawTranscript: string, seconds: number | null, bankKey: string): PitchResult {
  const text = normalise(rawTranscript);
  const words = text ? text.split(" ").length : 0;
  const wpm = seconds && seconds >= 10 && words > 0 ? Math.round(words / (seconds / 60)) : null;
  const per100 = (n: number) => (words ? (n / words) * 100 : 0);

  const fillers = find(text, FILLERS);
  const risky = find(text, RISKY);
  const blame = find(text, BLAME);
  const vague = find(text, VAGUE);
  const empathy = find(text, EMPATHY);
  const greeting = find(text, GREETING);
  const questions = (rawTranscript.match(/\?/g) ?? []).length + find(text, QUESTION_PHRASES).length;
  const usage = find(text, USAGE);
  const ack = find(text, ACK);
  const evidence = find(text, EVIDENCE);
  const pressure = find(text, PRESSURE);
  const numbers = text.match(/\b\d+(\.\d+)?(st|nd|rd|th)?\b/g) ?? [];
  const dates = find(text, DATE_TERMS);
  const follow = find(text, FOLLOW);
  const value = find(text, VALUE);
  const links = find(text, LINKS);
  const hype = find(text, HYPE);
  const product = uniq(find(text, PRODUCT));
  const overpromise = find(text, ["definitely", "guarantee", "guaranteed", "i promise", "100 percent", "for sure", "no problem at all"]);
  const you = (text.match(/\b(you|your|you're|yours)\b/g) ?? []).length;
  const tail = text.split(" ").slice(Math.floor(words * 0.6)).join(" ");
  const nextStep = find(tail, NEXT_STEP);

  const m = Math.min;
  const scores: Record<PitchObjective, number> = {
    Empathy: clamp(30 + 16 * m(empathy.length, 3) + (greeting.length ? 8 : 0) + m(14, Math.round(per100(you) * 1.6)) - 12 * m(blame.length, 2)),
    "Needs discovery": clamp(Math.min(questions === 0 ? 45 : 98, 28 + 18 * m(questions, 3) + (usage.length ? 8 : 0))),
    "Objection handling": clamp(32 + 14 * m(ack.length, 2) + 10 * m(evidence.length, 3) - 14 * m(risky.filter((r) => ["trust me", "expires today"].includes(r)).length + pressure.length, 2) - 12 * m(blame.length, 2)),
    "Expectation management": clamp(30 + 9 * m(numbers.length + dates.length, 4) + 12 * m(follow.length, 2) - 7 * m(vague.length, 3) - 12 * m(overpromise.length, 2)),
    "Value communication": clamp(30 + 10 * m(value.length, 4) + 8 * m(links.length, 2) + 4 * m(product.length, 3) - 8 * m(hype.length, 2)),
  };

  const tooShort = words < 40;
  const fillerPer100 = Math.round(per100(fillers.length) * 10) / 10;
  let overall = PITCH_OBJECTIVES.reduce((a, k) => a + scores[k], 0) / PITCH_OBJECTIVES.length;
  if (fillerPer100 > 3) overall -= m(8, (fillerPer100 - 3) * 1.5);
  if (wpm !== null && (wpm > 180 || wpm < 90)) overall -= 4;
  if (tooShort) overall = m(overall, 55);
  overall = clamp(overall);
  const band = overall >= 80 ? "Strong" : overall >= 60 ? "Solid" : "Needs work";

  const checklist = [
    { label: "Opened with a greeting or acknowledgement", ok: greeting.length > 0 || empathy.length > 0 },
    { label: "Acknowledged the customer's concern", ok: empathy.length > 0 || ack.length > 0 },
    { label: "Asked the customer a question", ok: questions > 0 },
    { label: "Gave a specific fact, number or date", ok: numbers.length > 0 || dates.length > 0 || product.length > 0 },
    { label: "Backed a claim with something checkable", ok: evidence.length > 0 },
    { label: "Ended with a clear next step", ok: nextStep.length > 0 },
  ];

  const bank = BANKS[bankKey] ?? BANKS.delivery;
  const best = (objective: string) => {
    const turn = bank.turns.find((t) => t.objective === objective);
    return turn ? [...turn.options].sort((a, b) => b.score - a.score)[0].text : undefined;
  };
  const quote = (a: string[]) => uniq(a).slice(0, 3).map((x) => `"${x}"`).join(", ");

  const objectiveTips: Record<PitchObjective, () => Omit<Tip, "area" | "severity" | "example">> = {
    Empathy: () => ({
      issue: blame.length ? `You put the blame elsewhere (${quote(blame)}).` : "Little acknowledgement of how the customer feels.",
      suggestion: blame.length ? "Own the part you can control, then explain what you will do about it." : "Name the problem in your own words before you explain anything. One sentence is enough.",
    }),
    "Needs discovery": () => ({
      issue: questions === 0 ? "You did not ask the customer anything." : "You asked very few questions.",
      suggestion: "Ask one open question before you recommend anything, such as what matters most to them or how they will use the car.",
    }),
    "Objection handling": () => ({
      issue: pressure.length || risky.some((r) => r === "trust me") ? `Some lines sound like pressure (${quote([...pressure, ...risky.filter((r) => r === "trust me")])}).` : ack.length ? "The objection was acknowledged but not backed up." : "The customer's objection was not welcomed or answered with proof.",
      suggestion: "Say the concern is fair, then offer something they can check: the warranty terms, a written price breakup, or an owner they can speak to.",
    }),
    "Expectation management": () => ({
      issue: overpromise.length ? `Promises you may not be able to keep (${quote(overpromise)}).` : vague.length ? `Vague wording (${quote(vague)}).` : numbers.length + dates.length === 0 ? "No specific date or number was given." : follow.length === 0 ? "You gave a date but no follow-up step." : "Only one date or follow-up was given.",
      suggestion: follow.length === 0 && numbers.length + dates.length > 0 ? "Add when and how you will update the customer next, for example a message on a set day." : "Replace ranges and 'should be' with one date, one number and the time you will next update the customer.",
    }),
    "Value communication": () => ({
      issue: hype.length ? `Claims without evidence (${quote(hype)}).` : "Features were not tied to this customer's own use.",
      suggestion: "Connect each feature to their daily use: running cost, commute, or how long until the extra price pays back.",
    }),
  };

  const tips: Tip[] = [];
  [...PITCH_OBJECTIVES].sort((a, b) => scores[a] - scores[b]).filter((k) => scores[k] < 75).slice(0, 3).forEach((k) => {
    tips.push({ area: k, severity: scores[k] < 55 ? "high" : "medium", ...objectiveTips[k](), example: best(k) });
  });
  if (fillerPer100 > 4 && fillers.length >= 3) tips.push({ area: "Delivery", severity: "medium", issue: `${fillers.length} filler words (${quote(fillers)}).`, suggestion: "Pause instead of filling the gap. A short silence sounds more confident than 'you know'." });
  if (wpm !== null && wpm > 170) tips.push({ area: "Delivery", severity: "medium", issue: `You spoke at about ${wpm} words per minute.`, suggestion: "Slow down to 120 to 160. Customers who are already unhappy need time to take in what you say." });
  if (wpm !== null && wpm < 95) tips.push({ area: "Delivery", severity: "low", issue: `You spoke at about ${wpm} words per minute.`, suggestion: "Pick up the pace a little, to around 120 to 160 words per minute, so the pitch keeps its energy." });
  if (seconds !== null && seconds > 180) tips.push({ area: "Delivery", severity: "low", issue: "The pitch ran past three minutes.", suggestion: "Aim for under two minutes. Lead with the answer, then give one supporting reason." });
  if (tooShort) tips.unshift({ area: "Length", severity: "high", issue: "The pitch is too short to judge properly.", suggestion: "Talk for at least 45 seconds: acknowledge the concern, ask a question, give one specific fact and end with a next step." });
  const riskyLeft = risky.filter((r) => !tips.some((t) => t.issue.includes(`"${r}"`)));
  if (riskyLeft.length) tips.push({ area: "Wording", severity: "medium", issue: `Phrases that customers tend to distrust: ${quote(riskyLeft)}.`, suggestion: "Replace them with a fact or a written commitment." });

  const strengths = PITCH_OBJECTIVES.filter((k) => scores[k] >= 75).map((k) => `${k}: ${scores[k]}. ${{
    Empathy: "You acknowledged the customer before explaining.",
    "Needs discovery": "You asked questions before recommending.",
    "Objection handling": "You welcomed the concern and offered proof.",
    "Expectation management": "You gave specific dates or numbers and a follow-up.",
    "Value communication": "You tied the product to the customer's own use.",
  }[k]}`);

  const flags: Flag[] = [
    ...fillers.map((term) => ({ term, kind: "filler" as const })),
    ...risky.map((term) => ({ term, kind: "risky" as const })),
    ...blame.map((term) => ({ term, kind: "blame" as const })),
    ...vague.map((term) => ({ term, kind: "vague" as const })),
  ];

  return {
    overall, band, scores, tooShort, checklist, strengths, tips, flags,
    metrics: { words, seconds, wpm, fillerCount: fillers.length, fillerPer100, questions },
  };
}

/** Splits a transcript into plain and flagged parts so the UI can highlight them. */
export function highlightParts(transcript: string, flags: Flag[]): { text: string; kind?: Flag["kind"] }[] {
  const kinds = new Map(flags.map((f) => [f.term.toLowerCase(), f.kind]));
  if (!kinds.size) return [{ text: transcript }];
  const rx = matcher([...kinds.keys()]);
  const out: { text: string; kind?: Flag["kind"] }[] = [];
  let last = 0;
  for (const m of transcript.replace(/[\u2018\u2019]/g, "'").matchAll(rx)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ text: transcript.slice(last, i) });
    out.push({ text: transcript.slice(i, i + m[0].length), kind: kinds.get(m[0].toLowerCase()) });
    last = i + m[0].length;
  }
  if (last < transcript.length) out.push({ text: transcript.slice(last) });
  return out;
}
