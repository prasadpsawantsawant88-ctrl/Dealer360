/* Dealer360 simulation. Deterministic (seeded). Run: npm run generate-data
   Nothing in the UI is hard-coded from the source PDF: every figure is produced here. */
import fs from "node:fs";
import path from "node:path";
import { classify } from "../lib/classify";

const OUT = path.join(__dirname, "..", "data");
function mulberry32(a: number) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const R = mulberry32(2026);
const rand = (a: number, b: number) => a + (b - a) * R();
const int = (a: number, b: number) => Math.floor(rand(a, b + 1));
const pick = <T>(arr: T[]): T => arr[Math.floor(R() * arr.length)];
const gauss = () => { let u = 0, v = 0; while (u === 0) u = R(); while (v === 0) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const round = (x: number, d = 0) => { const m = 10 ** d; return Math.round(x * m) / m; };
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const mean = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const median = (a: number[]) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const sd = (a: number[]) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
function shuffle<T>(a: T[]) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const erf = (x: number) => { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };

// ---------- reference data ----------
const N_DEALERS = 150;
const NOW = Date.UTC(2026, 9, 1);
const REGIONS = ["North", "South", "East", "West", "Central"];
const CITIES: Record<string, string[]> = { North: ["Delhi", "Chandigarh", "Lucknow", "Jaipur", "Dehradun"], South: ["Bengaluru", "Chennai", "Hyderabad", "Kochi", "Coimbatore"], East: ["Kolkata", "Bhubaneswar", "Patna", "Guwahati", "Ranchi"], West: ["Pune", "Mumbai", "Ahmedabad", "Surat", "Nashik"], Central: ["Bhopal", "Indore", "Raipur", "Nagpur", "Jabalpur"] };
const PREFIX = ["Apex", "Metro", "Summit", "Horizon", "Crest", "Prime", "Vertex", "Zenith", "Sterling", "Nova", "Regal", "Pinnacle", "Evergreen", "Orbit", "Lakeview", "Capital", "Heritage", "Unity", "Royal", "Skyline", "Harbor", "Meridian", "Quest", "Beacon", "Atlas"];
const SUFFIX = ["Motors", "Auto", "Automobiles", "Cars", "Wheels", "Mobility"];
const FIRST = ["Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anjali", "Rohan", "Neha", "Karan", "Pooja", "Arjun", "Divya", "Sandeep", "Meera", "Nikhil", "Kavita", "Suresh", "Ritu", "Manish", "Isha", "Varun", "Swati", "Aakash", "Tanvi", "Harsh", "Shruti", "Deepak", "Nisha", "Gaurav", "Aditi"];
const LAST = ["Sharma", "Iyer", "Patil", "Nair", "Verma", "Kulkarni", "Reddy", "Singh", "Mehta", "Gupta", "Joshi", "Desai", "Menon", "Bhatt", "Kapoor", "Rao", "Chopra", "Pillai", "Malhotra", "Shetty"];
const MODELS = ["Nexus EV", "Aero Sedan", "Terra SUV", "Haul Truck", "Vista Hatch", "Orion SUV"];
const UNIT_VALUE_LAKH: Record<string, number> = { Sedan: 9.5, SUV: 14, Truck: 16, EV: 18 };
const DIM_KEYS = ["sales", "csat", "service", "inventory", "compliance"] as const;
type DimKey = (typeof DIM_KEYS)[number];
const DIM_LABEL: Record<DimKey, string> = { sales: "Sales Performance", csat: "Customer Satisfaction", service: "Service Revenue", inventory: "Inventory Health", compliance: "Compliance" };
const EXPERT_W: Record<DimKey, number> = { sales: 0.25, csat: 0.2, service: 0.2, inventory: 0.2, compliance: 0.15 };
const TRUE_W: Record<DimKey, number> = { sales: 0.3, csat: 0.22, service: 0.2, inventory: 0.14, compliance: 0.14 }; // hidden "reality" the model must recover
const wsum = (d: any, w: Record<DimKey, number>) => DIM_KEYS.reduce((s, k) => s + w[k] * d[k], 0);
const COMP_KEYS = ["productKnowledge", "customerRapport", "closingSkills", "objectionHandling", "followUp"] as const;
const COMP_LABEL: Record<string, string> = { productKnowledge: "Product knowledge", customerRapport: "Customer rapport", closingSkills: "Closing", objectionHandling: "Objection handling", followUp: "Follow-up" };
const WEAK_THEME: Record<string, string> = { productKnowledge: "product knowledge", customerRapport: "communication", closingSkills: "pricing communication", objectionHandling: "delivery expectations", followUp: "follow-up" };
const CATEGORY: Record<string, string> = { "delivery expectations": "Delivery Experience", "follow-up": "Sales Process", "pricing communication": "Sales Process", "product knowledge": "Sales Process", "finance explanation": "Financing", service: "Service Quality", communication: "Communication" };
const JOURNEY: Record<string, string> = { "delivery expectations": "Delivery", "follow-up": "Post-sale", "pricing communication": "Purchase", "finance explanation": "Purchase", service: "Service", "product knowledge": "Pre-sale", communication: "Post-sale" };
const ROOT_GROUP: Record<string, string> = { "delivery expectations": "Sales process gaps", "follow-up": "Sales process gaps", "pricing communication": "Sales process gaps", "product knowledge": "Sales process gaps", "finance explanation": "Finance process", service: "Service handoff", communication: "Communication" };
const TEXTS: Record<string, string[]> = {
  "delivery expectations": ["I was told {model} delivery would take two weeks. Now the dealership says four weeks and nobody explains why.", "The promised delivery date for my {model} has slipped twice with no proactive update.", "The salesperson committed to a delivery date that the dealership could not honour for my {model}."],
  "follow-up": ["No one called after I bought my {model}. I had questions about registration and still have no answer.", "Post-sale follow-up never happened; I had to chase the dealership for my {model} documents.", "After I bought the {model}, nobody checked in and I had to chase for the insurance copy."],
  "pricing communication": ["The final price for my {model} included add-ons I never agreed to; I felt pushed into upgrades.", "The quoted on-road price for the {model} changed at billing.", "Accessories were pressed on me and the price breakup for the {model} was unclear."],
  "finance explanation": ["EMI and processing charges on my {model} loan were not explained before I signed.", "The interest rate I was told for the {model} loan differs from the loan agreement.", "Nobody explained the loan prepayment charges on my {model} finance."],
  service: ["My {model} came back from service with the same fault and the workshop took six days.", "The service appointment for my {model} was rescheduled three times.", "The workshop kept my {model} for a week and gave no status updates."],
  "product knowledge": ["The salesperson could not explain the {model} battery and charging features and gave conflicting answers.", "Variant differences for the {model} were explained incorrectly.", "I asked about the {model} features and was told different things on two visits."],
  communication: ["Messages and calls to the dealership about my {model} went unanswered for days.", "Different staff gave me different information about my {model} order.", "I could not reach anyone with answers about my {model}; calls kept going unanswered."],
};
const WHY: Record<string, string[]> = {
  "delivery expectations": ["Why were customers upset? Promised delivery dates were not met.", "Why were dates missed? Salespeople committed dates without checking stock or logistics status.", "Why was there no check? No delivery-commitment process and no coaching in expectation-setting (root cause)."],
  "follow-up": ["Why were customers upset? Nobody followed up after purchase.", "Why was there no follow-up? Ownership of post-sale contact is unclear.", "Why is it unclear? No cadence or CRM reminders exist after delivery (root cause)."],
  "pricing communication": ["Why were customers upset? The final price differed from what they expected.", "Why? Add-ons and charges were explained late or only verbally.", "Why? No written price-breakup step before booking, and weak price-objection handling (root cause)."],
  "finance explanation": ["Why were customers upset? Loan terms surprised them.", "Why? EMI, interest and charges were not explained before signing.", "Why? Finance disclosure is not part of the booking checklist (root cause)."],
  service: ["Why were customers upset? Service work was slow or repeated.", "Why? Workshop status updates and sales-to-service handoffs are weak.", "Why? No service-handoff process or status notifications exist (root cause)."],
  "product knowledge": ["Why were customers upset? They received conflicting product answers.", "Why? Salespeople could not explain variants and features consistently.", "Why? Product training and a briefing sheet are missing (root cause)."],
  communication: ["Why were customers upset? Calls and messages went unanswered.", "Why? Several staff handle one customer with no single owner.", "Why? No shared inbox or callback tracking exists (root cause)."],
};
const PROC: Record<string, string> = { "delivery expectations": "delivery-date commitment checklist", "follow-up": "post-sale follow-up ownership and cadence", "pricing communication": "written price breakup before booking", "finance explanation": "loan terms briefing before signature", service: "service status updates and handoff", "product knowledge": "variant and feature briefing sheet", communication: "single point of contact per customer" };
const TECH: Record<string, string> = { "delivery expectations": "Delivery-date tracker visible to sales and customer", "follow-up": "CRM follow-up reminders and automation", "pricing communication": "Quote tool with locked price breakup", "finance explanation": "Finance disclosure checklist in the booking system", service: "Service job-status notifications", "product knowledge": "In-CRM variant comparison guide", communication: "Shared inbox and callback tracking" };
const SEQ = ["customerRapport", "productKnowledge", "objectionHandling", "productKnowledge", "followUp", "objectionHandling", "closingSkills", "customerRapport", "closingSkills"];
const REASONS: Record<string, string[]> = {
  objectionHandling: ["Failed to acknowledge the concern", "Generic response instead of addressing the objection", "Did not clarify the customer's underlying need"],
  closingSkills: ["No clear next step was proposed", "Pitched add-ons before resolving the customer's concern", "Customer left without a follow-up date"],
  productKnowledge: ["Feature answer was incomplete or inconsistent", "Variant differences were not explained", "Could not link features to the customer's use"],
  customerRapport: ["Little acknowledgement of the customer's situation", "Moved to the pitch before building trust", "Tone did not match the customer's concern"],
  followUp: ["No commitment to a follow-up time", "Did not confirm contact preference", "Open questions were left unanswered"],
};
const STAGES = ["Complaint Received", "Case Assigned", "In Progress", "Resolution Proposed", "Customer Accepted", "Recovery Complete"];
const SEV = ["Normal", "Watch", "At-Risk", "Critical"];
const sevIndex = (s: string) => SEV.indexOf(s);
const DRIVER: Record<DimKey, string> = { sales: "Conversion / complaints", csat: "CSI decline", inventory: "Inventory ageing", service: "Payment delays", compliance: "Compliance gaps" };
const statusOf = (h: number) => (h >= 72 ? "Healthy" : h >= 65 ? "Watch" : "At-Risk");
const months: string[] = [];
for (let i = 23; i >= 0; i--) months.push(new Date(Date.UTC(2026, 8 - i, 1)).toISOString().slice(0, 7));

// ---------- 1. latent dealer state, shared by history and current dealers ----------
function sampleState() {
  const q = gauss();
  const d = (m = 69, a = 8, b = 8) => clamp(Math.round(m + a * q + b * gauss()), 30, 97);
  const dims: any = { sales: d(), csat: d(), service: d(), inventory: d(), compliance: d(74, 5, 6) };
  const cp100 = clamp(round(9 - 0.13 * (dims.csat - 60) + 0.8 * gauss(), 1), 1.5, 16);
  const inv90 = clamp(round(20 - 0.45 * (dims.inventory - 60) + 3 * gauss(), 1), 3, 45);
  const ht = wsum(dims, TRUE_W);
  const trend = round(clamp(gauss() * 2 + (ht < 65 ? -2.5 : ht < 72 ? -1 : 0.8), -7, 5), 1);
  return { dims, cp100, inv90, trend, ht };
}

// ---------- 2. "ML" calibration of dimension weights on simulated history ----------
function solve(A: number[][], b: number[]) {
  const n = b.length; const M = A.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < n; i++) {
    let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
    [M[i], M[p]] = [M[p], M[i]];
    for (let r = 0; r < n; r++) { if (r === i) continue; const f = M[r][i] / M[i][i]; for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}
function ols(X: number[][], y: number[]) {
  const p = X[0].length + 1; const A = Array.from({ length: p }, () => Array(p).fill(0)); const b = Array(p).fill(0);
  X.forEach((x, i) => { const z = [1, ...x]; for (let a = 0; a < p; a++) { b[a] += z[a] * y[i]; for (let c = 0; c < p; c++) A[a][c] += z[a] * z[c]; } });
  return solve(A, b);
}
const HIST = Array.from({ length: 2500 }, () => { const s = sampleState(); return { ...s, perf: wsum(s.dims, TRUE_W) + 3.5 * gauss() }; });
function fitWeights(rows: typeof HIST) {
  const beta = ols(rows.map((r) => DIM_KEYS.map((k) => r.dims[k])), rows.map((r) => r.perf)).slice(1).map((b) => Math.max(0, b));
  const s = beta.reduce((a, b) => a + b, 0); return beta.map((b) => b / s);
}
const wFit = fitWeights(HIST);
const boots = Array.from({ length: 150 }, () => fitWeights(Array.from({ length: HIST.length }, () => HIST[Math.floor(R() * HIST.length)])));
const wCI = DIM_KEYS.map((_, k) => 1.96 * sd(boots.map((b) => b[k])) * 100);
const ML_W: Record<DimKey, number> = Object.fromEntries(DIM_KEYS.map((k, i) => [k, wFit[i]])) as any;
const fullBeta = ols(HIST.map((r) => DIM_KEYS.map((k) => r.dims[k])), HIST.map((r) => r.perf));
const predicted = HIST.map((r) => fullBeta[0] + DIM_KEYS.reduce((s, k, i) => s + fullBeta[i + 1] * r.dims[k], 0));
const ym = mean(HIST.map((r) => r.perf));
const r2 = 1 - HIST.reduce((s, r, i) => s + (r.perf - predicted[i]) ** 2, 0) / HIST.reduce((s, r) => s + (r.perf - ym) ** 2, 0);

// ---------- 3. deterioration-risk model (logistic regression on simulated history) ----------
const FEATS = ["Health score", "Health trend (quarter)", "Complaint rate", "Inventory 90+ day share"];
const featRow = (health: number, s: any) => [health, s.trend, s.cp100, s.inv90];
const histFeat = HIST.map((r) => featRow(wsum(r.dims, ML_W), r));
const histY = HIST.map((r) => (R() < sigmoid(-0.9 + 0.11 * (66 - r.ht) - 0.28 * r.trend + 0.14 * (r.cp100 - 9) + 0.045 * (r.inv90 - 20)) ? 1 : 0));
const fMu = FEATS.map((_, j) => mean(histFeat.map((x) => x[j]))); const fSd = FEATS.map((_, j) => sd(histFeat.map((x) => x[j])));
const Z = histFeat.map((x) => x.map((v, j) => (v - fMu[j]) / fSd[j]));
let lw = FEATS.map(() => 0), lb = 0;
for (let it = 0; it < 2500; it++) {
  const g = FEATS.map(() => 0); let gb = 0;
  for (let i = 0; i < Z.length; i++) { const e = sigmoid(lb + Z[i].reduce((s, v, j) => s + v * lw[j], 0)) - histY[i]; gb += e; for (let j = 0; j < g.length; j++) g[j] += e * Z[i][j]; }
  lb -= (0.3 * gb) / Z.length; lw = lw.map((w, j) => w - (0.3 * g[j]) / Z.length);
}
const riskOf = (health: number, s: any) => { const x = featRow(health, s); return sigmoid(lb + x.reduce((a, v, j) => a + ((v - fMu[j]) / fSd[j]) * lw[j], 0)); };
const scoresHist = Z.map((z) => sigmoid(lb + z.reduce((s, v, j) => s + v * lw[j], 0)));
let aucNum = 0, pos = 0, neg = 0;
const posS = scoresHist.filter((_, i) => histY[i] === 1), negS = scoresHist.filter((_, i) => histY[i] === 0);
pos = posS.length; neg = negS.length;
for (const a of posS) for (const b of negS) aucNum += a > b ? 1 : a === b ? 0.5 : 0;
const auc = aucNum / (pos * neg);
const impAbs = lw.map(Math.abs); const impSum = impAbs.reduce((a, b) => a + b, 0);

// ---------- 4. dealers ----------
const used = new Set<string>(["ABC Motors"]);
const dealerName = () => { for (;;) { const n = `${pick(PREFIX)} ${pick(SUFFIX)}`; if (!used.has(n)) { used.add(n); return n; } } };
const dealers: any[] = [];
for (let i = 0; i < N_DEALERS; i++) {
  const s = sampleState();
  const region = REGIONS[i % 5];
  const health = Math.round(wsum(s.dims, ML_W));
  const unitsPerMonth = int(35, 120);
  const lowest = DIM_KEYS.reduce((a, b) => (s.dims[a] <= s.dims[b] ? a : b));
  const risk = clamp(round(riskOf(health, s), 2), 0.02, 0.97);
  const impact = clamp(round(unitsPerMonth / 120, 2), 0.3, 1);
  const ctrl = round(rand(0.5, 0.9), 2);
  dealers.push({
    id: `D${String(i + 1).padStart(3, "0")}`, name: dealerName(), region, city: pick(CITIES[region]),
    tier: unitsPerMonth > 85 ? "A" : unitsPerMonth > 55 ? "B" : "C",
    health, healthExpert: Math.round(wsum(s.dims, EXPERT_W)), status: statusOf(health), risk, trendPerQuarter: s.trend,
    dims: s.dims, businessImpact: impact, controllability: ctrl, priorityScore: round(risk * impact * ctrl, 3),
    driver: DRIVER[lowest as DimKey], weakestDimension: lowest, unitsPerMonth, regionalPercentile: 0, driverNarrative: "",
    kpis: {
      conversionPct: 0, csi: clamp(round(58 + 0.5 * (s.dims.csat - 60) + 2 * gauss(), 1), 50, 97), complaintsPer100: s.cp100, inventoryOver90Pct: s.inv90,
      avgDaysToSale: clamp(round(20 + 0.5 * s.inv90 + 2 * gauss()), 18, 70), dsoDays: clamp(round(34 - 0.4 * (s.dims.service - 60) + 3 * gauss()), 15, 75),
      marginPct: clamp(round(5.5 + 0.06 * (s.dims.service - 60) - 0.04 * s.inv90 + 0.4 * gauss(), 1), 1, 12),
      paymentDelayDays: clamp(round(2 + 0.12 * (60 - s.dims.service) + gauss(), 1), 0, 25), resolutionDays: 2.4,
      serviceRevenueIndex: clamp(round(100 + 1.2 * (s.dims.service - 70) + 3 * gauss()), 60, 130),
      salesGrowthPct: round(0.35 * (s.dims.sales - 65) + 2 * gauss(), 1), avgCompetency: 0, trainingHours: 0,
    },
    funnel: { leads: 0, testDrives: 0, quotes: 0, orders: 0, deliveries: 0 },
  });
}
const ranked = [...dealers].sort((a, b) => b.priorityScore - a.priorityScore);
const P_CUT = { P1: 0.35, P2: 0.22, P3: 0.12 };
ranked.forEach((d, i) => { d.rank = i + 1; d.priority = d.priorityScore >= P_CUT.P1 ? "P1" : d.priorityScore >= P_CUT.P2 ? "P2" : d.priorityScore >= P_CUT.P3 ? "P3" : "Monitor"; });
const byId: Record<string, any> = Object.fromEntries(dealers.map((d) => [d.id, d]));
for (const d of dealers) { const peers = dealers.filter((x) => x.region === d.region); d.regionalPercentile = Math.round((peers.filter((x) => x.health < d.health).length / peers.length) * 100); }

// ---------- 5. salespeople ----------
const salespeople: any[] = [];
let sIdx = 1;
const personName = () => { for (;;) { const n = `${pick(FIRST)} ${pick(LAST)}`; if (n !== "Rahul Sharma") return n; } };
const convOf = (comp: any) => { const v = COMP_KEYS.map((c) => comp[c]); return 0.28 * mean(v) + 0.12 * Math.min(...v); };
for (const dl of dealers) {
  const n = int(2, 5);
  for (let k = 0; k < n; k++) {
    const base = 62 + 0.45 * (dl.dims.sales - 60);
    const comp: any = {}; for (const key of COMP_KEYS) comp[key] = clamp(Math.round(base + 9 * gauss()), 30, 95);
    const weak = pick([...COMP_KEYS]); comp[weak] = clamp(comp[weak] - 14, 25, 95);
    const vals = COMP_KEYS.map((c) => comp[c]); const avg = mean(vals);
    const weakKey = COMP_KEYS.reduce((a, b) => (comp[a] <= comp[b] ? a : b));
    const conv = clamp(round(convOf(comp) + 1.5 * gauss(), 1), 9, 36);
    const units = int(60, 170);
    const rate = clamp(3.1 + (70 - avg) * 0.07 + (comp[weakKey] < 45 ? 0.8 : 0) + 0.6 * gauss(), 0.4, 9);
    salespeople.push({ id: `S${String(sIdx++).padStart(4, "0")}`, name: personName(), dealerId: dl.id, dealerName: dl.name, role: k === 0 ? "Senior Sales Consultant" : "Sales Consultant", tenureMonths: int(6, 96), unitsSold12m: units, conversionPct: conv, competencies: comp, avgCompetency: round(avg, 1), weakestCompetency: weakKey, trainingHours12m: clamp(Math.round(30 - (70 - avg) * 0.6 + 4 * gauss()), 2, 48), _rate: rate });
  }
}
const medianRate = median(salespeople.map((s) => s._rate));
for (const s of salespeople) { s.complaintRatePer100 = round(s._rate, 2); s.complaintCount = Math.round((s._rate * s.unitsSold12m) / 100); s.complaintIncidenceVsPeer = round(s._rate / medianRate, 2); s.flaggedForCoaching = s.complaintIncidenceVsPeer >= 1.5; }
const team = (id: string) => salespeople.filter((s) => s.dealerId === id);
// simulated recorded pitch (9 minutes) per salesperson; drops come from the weak skill being tested
const pitch: Record<string, any> = {};
for (const s of salespeople) {
  let prev = 70; const scores: number[] = [];
  SEQ.forEach((sk) => { const v = clamp(Math.round(0.7 * s.competencies[sk] + 0.3 * prev + 4 * gauss()), 20, 96); scores.push(v); prev = v; });
  const drops = scores.map((v, m) => ({ m, d: m ? scores[m - 1] - v : 0 })).filter((x) => x.d >= 8).sort((a, b) => b.d - a.d).slice(0, 3).sort((a, b) => a.m - b.m)
    .map((x) => ({ minute: x.m + 1, from: scores[x.m - 1], to: scores[x.m], skill: COMP_LABEL[SEQ[x.m]], subFrom: clamp(Math.round(s.competencies[SEQ[x.m - 1]] + 3 * gauss()), 20, 96), subTo: clamp(Math.round(s.competencies[SEQ[x.m]] + 3 * gauss()), 20, 96), why: REASONS[SEQ[x.m]] }));
  pitch[s.id] = { scores, drops };
}
// hero = best-ranked P1/P2 dealer that has a flagged salesperson with at least 2 pitch drops
let hero: any = null, heroSp: any = null;
for (const d of ranked) {
  if (d.priority === "Monitor") break;
  const cand = team(d.id).filter((s) => s.flaggedForCoaching && pitch[s.id].drops.length >= 2).sort((a, b) => b.complaintIncidenceVsPeer - a.complaintIncidenceVsPeer)[0];
  if (cand) { hero = d; heroSp = cand; break; }
}
if (!hero) { hero = ranked[0]; heroSp = team(hero.id).sort((a, b) => b.complaintIncidenceVsPeer - a.complaintIncidenceVsPeer)[0]; }
hero.name = "ABC Motors"; hero.city = "Pune"; hero.region = "West"; heroSp.name = "Rahul Sharma";
for (const s of salespeople) if (s.dealerId === hero.id) s.dealerName = hero.name;
for (const d of dealers) { const peers = dealers.filter((x) => x.region === d.region); d.regionalPercentile = Math.round((peers.filter((x) => x.health < d.health).length / peers.length) * 100); }
for (const dl of dealers) {
  const t = team(dl.id); const u = t.reduce((a, s) => a + s.unitsSold12m, 0);
  dl.kpis.conversionPct = round(t.reduce((a, s) => a + s.conversionPct * s.unitsSold12m, 0) / u, 1);
  dl.kpis.avgCompetency = round(mean(t.map((s) => s.avgCompetency)), 1);
  dl.kpis.trainingHours = round(mean(t.map((s) => s.trainingHours12m)), 1);
  // sales funnel (per quarter) consistent with conversion
  const D = dl.unitsPerMonth * 3, L = Math.round(D / (dl.kpis.conversionPct / 100)), r = (D / 0.92) / L;
  let td = clamp(Math.pow(r, 0.38) * Math.exp(0.07 * gauss()), 0.3, 0.95), qt = clamp(Math.pow(r, 0.32) * Math.exp(0.07 * gauss()), 0.3, 0.95);
  const o = clamp(r / (td * qt), 0.3, 0.97);
  const tds = Math.round(L * td), qs = Math.round(tds * qt), os = Math.round(qs * o);
  dl.funnel = { leads: L, testDrives: tds, quotes: qs, orders: Math.max(os, D), deliveries: D };
}
const heroFocusId = (dlId: string) => team(dlId).sort((a, b) => b.complaintIncidenceVsPeer - a.complaintIncidenceVsPeer)[0].id;

// ---------- 6. complaints with timing, repeats and a simulated recovery workflow ----------
const complaints: any[] = [];
function addComplaint(dl: any, sp: any | null, theme: string, repeatOf?: any) {
  const model = repeatOf ? repeatOf.model : pick(MODELS);
  const z = gauss() + (70 - dl.health) / 18 + (theme === "delivery expectations" ? 0.3 : 0);
  const severity = z > 1.6 ? "Critical" : z > 0.8 ? "At-Risk" : z > 0 ? "Watch" : "Normal";
  let age = repeatOf ? Math.max(1, repeatOf._age - int(10, 60)) : Math.max(1, Math.floor(365 * Math.pow(R(), 1 + Math.max(0, -dl.trendPerQuarter) * 0.12)));
  const c: any = { dealerId: dl.id, dealerName: dl.name, date: new Date(NOW - age * 86400000).toISOString().slice(0, 10), _age: age, customer: repeatOf ? repeatOf.customer : `${pick(FIRST)} ${pick(LAST)}`, salespersonId: sp ? sp.id : null, salespersonName: sp ? sp.name : null, model, text: pick(TEXTS[theme]).replace("{model}", model), category: CATEGORY[theme], theme, severity, journeyStage: JOURNEY[theme], isRepeat: !!repeatOf };
  complaints.push(c);
  if (!repeatOf && age > 15 && R() < clamp(0.04 + 0.03 * sevIndex(severity) + (70 - dl.health) * 0.002, 0.02, 0.25)) addComplaint(dl, sp, R() < 0.6 ? theme : pick(Object.keys(TEXTS)), c);
}
const SALES_THEMES = ["delivery expectations", "follow-up", "pricing communication", "product knowledge", "communication", "finance explanation"];
for (const s of salespeople) {
  const dl = byId[s.dealerId]; const themes: Record<string, number> = {};
  for (let k = 0; k < s.complaintCount; k++) { const theme = R() < 0.6 ? WEAK_THEME[s.weakestCompetency] : pick(SALES_THEMES); themes[theme] = (themes[theme] || 0) + 1; addComplaint(dl, s, theme); }
  s.complaintThemes = themes;
}
for (const dl of dealers) {
  dl.kpis.resolutionDays = round(clamp(2.4 + (dl.kpis.complaintsPer100 - 9) * 0.2, 1, 5), 1);
  const n = Math.round((dl.kpis.complaintsPer100 * dl.unitsPerMonth * 12 * 0.16) / 100);
  for (let k = 0; k < n; k++) { const r = R(); addComplaint(dl, null, r < 0.7 ? "service" : r < 0.85 ? "communication" : "finance explanation"); }
}
// recovery workflow simulation: each case walks the 6 stages with drop-off and elapsed time
const DUR = [0.3, 0.7, 0.6, 0.5, 0.3], P0 = [0.92, 0.7, 0.85, 0.86, 0.94];
for (const c of complaints) {
  const dl = byId[c.dealerId]; const speed = dl.kpis.resolutionDays / 2.4; const sv = sevIndex(c.severity);
  let stage = 0, t = 0, stalled = false;
  for (let k = 0; k < 5; k++) {
    const p = clamp(P0[k] + (dl.health - 70) * 0.003 - (k === 1 ? 0.02 * sv : 0), 0.5, 0.98);
    if (R() > p) { stalled = true; break; }
    t += DUR[k] * speed * (0.8 + 0.25 * sv) * Math.exp(0.35 * gauss());
    if (t > c._age) break;
    stage = k + 1;
  }
  c.recoveryStage = STAGES[stage]; c.stageIndex = stage;
  c.resolutionDays = stage === 5 ? round(t, 1) : null;
  c.closedOutcome = stage === 5 ? "Recovered" : stalled && c._age > 45 ? "Lost" : "Open";
}
shuffle(complaints); complaints.sort((a, b) => (a.date < b.date ? -1 : 1));
complaints.forEach((c, i) => (c.id = `C-${String(i + 1).padStart(5, "0")}`));
const N = complaints.length;
const complaintsOut = complaints.map((c) => ({ id: c.id, dealerId: c.dealerId, dealerName: c.dealerName, date: c.date, customer: c.customer, salespersonId: c.salespersonId, salespersonName: c.salespersonName, model: c.model, text: c.text, category: c.category, theme: c.theme, severity: c.severity, journeyStage: c.journeyStage, isRepeat: c.isRepeat, resolutionDays: c.resolutionDays, recoveryStage: c.recoveryStage, closedOutcome: c.closedOutcome }));
const cStats = (rows: any[]) => {
  const rec = rows.filter((c) => c.closedOutcome === "Recovered"), lost = rows.filter((c) => c.closedOutcome === "Lost"), mature = rows.filter((c) => c._age > 30);
  return { n: rows.length, resolutionRatePct: round((mature.filter((c) => c.closedOutcome === "Recovered").length / Math.max(1, mature.length)) * 100, 1), repeatRatePct: round((rows.filter((c) => c.isRepeat).length / Math.max(1, rows.length)) * 100, 1), recoveryRatePct: round((rec.length / Math.max(1, rec.length + lost.length)) * 100, 1), avgResolutionDays: round(mean(rec.map((c) => c.resolutionDays)), 1) };
};
const funnelOf = (rows: any[]) => STAGES.map((stage, i) => { const count = rows.filter((c) => c.stageIndex >= i).length; return { stage, count, pct: round((count / Math.max(1, rows.length)) * 100, 1) }; });
const catList = ["Delivery Experience", "Sales Process", "Financing", "Service Quality", "Communication"];
const matrix = (rows: any[]) => catList.map((category) => { const r: any = { category, Critical: 0, "At-Risk": 0, Watch: 0, Normal: 0 }; rows.filter((c) => c.category === category).forEach((c) => r[c.severity]++); return r; });
const countBy = (rows: any[], f: (c: any) => string) => { const m: Record<string, number> = {}; rows.forEach((c) => { const k = f(c); m[k] = (m[k] || 0) + 1; }); return m; };
const topKey = (m: Record<string, number>) => Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0];

// dealer narrative: weakest dimension + most common complaint theme
for (const dl of dealers) {
  const rows = complaints.filter((c) => c.dealerId === dl.id); const th = countBy(rows, (c) => c.theme); const top = topKey(th);
  dl.driverNarrative = `${DIM_LABEL[dl.weakestDimension as DimKey]} is the weakest dimension (${dl.dims[dl.weakestDimension]}); most frequent complaint theme: ${top} (${Math.round(((th[top] || 0) / Math.max(1, rows.length)) * 100)}% of ${rows.length} complaints).`;
}

// ---------- 7. monthly metrics ----------
const monthly: any[] = []; const healthTrend: Record<string, any[]> = {};
for (const dl of dealers) {
  healthTrend[dl.id] = [];
  months.forEach((month, m) => {
    const k = 23 - m; const h = round(k === 0 ? dl.health : dl.health - (dl.trendPerQuarter / 3) * Math.min(k, 12) + gauss() * 1.2, 1);
    const delta = h - dl.health, nz = k === 0 ? 0 : 1, kp = dl.kpis;
    monthly.push({ dealerId: dl.id, month, healthScore: h, unitsSold: Math.max(5, Math.round(dl.unitsPerMonth * (1 + 0.004 * delta) + nz * gauss() * 2)), conversionPct: round(kp.conversionPct + 0.12 * delta + nz * gauss() * 0.4, 1), csi: round(kp.csi + 0.4 * delta + nz * gauss() * 0.8, 1), complaintsPer100: round(Math.max(0.5, kp.complaintsPer100 - 0.08 * delta + nz * gauss() * 0.4), 1), inventoryOver90Pct: round(Math.max(1, kp.inventoryOver90Pct - 0.3 * delta + nz * gauss()), 1), avgDaysToSale: Math.round(kp.avgDaysToSale - 0.15 * delta + nz * gauss() * 0.8), dsoDays: Math.round(kp.dsoDays - 0.2 * delta + nz * gauss()), marginPct: round(kp.marginPct + 0.03 * delta + nz * gauss() * 0.15, 1), paymentDelayDays: round(Math.max(0, kp.paymentDelayDays - 0.1 * delta + nz * gauss() * 0.3), 1) });
    healthTrend[dl.id].push({ month, health: h });
  });
}

// ---------- 8. inventory ----------
const BUCKETS = ["0-30", "31-60", "61-90", "90+"], SEGS = ["Sedan", "SUV", "Truck", "EV"];
const inventory: any[] = [];
for (const dl of dealers) {
  const total = Math.round(dl.unitsPerMonth * 1.8), p90 = dl.kpis.inventoryOver90Pct / 100, p61 = p90 * 1.35, p31 = (1 - p90 - p61) * 0.45;
  const bShare = [1 - p90 - p61 - p31, p31, p61, p90];
  const raw = [0.3 + 0.08 * gauss(), 0.38 + 0.08 * gauss(), 0.14 + 0.04 * gauss(), 0.18 + 0.05 * gauss()].map((x) => Math.max(0.05, x)); const rs = raw.reduce((a, b) => a + b, 0);
  SEGS.forEach((seg, si) => BUCKETS.forEach((b, bi) => inventory.push({ dealerId: dl.id, snapshot: "2026-09", segment: seg, ageBucket: b, units: Math.round(total * (raw[si] / rs) * bShare[bi]), avgDaysToSale: Math.round(dl.kpis.avgDaysToSale * ({ Sedan: 0.92, SUV: 1.08, Truck: 1.15, EV: 0.9 } as any)[seg]), unitValueLakh: UNIT_VALUE_LAKH[seg] })));
}
const invStats = (id: string) => { const rows = inventory.filter((r) => r.dealerId === id); const u = (f: (r: any) => boolean) => rows.filter(f).reduce((a, r) => a + r.units, 0); const slow = SEGS.map((s) => ({ s, d: mean(rows.filter((r) => r.segment === s).map((r) => r.avgDaysToSale)) })).sort((a, b) => b.d - a.d)[0]; return { total: u(() => true), over60: u((r) => r.ageBucket === "61-90" || r.ageBucket === "90+"), over90: u((r) => r.ageBucket === "90+"), capitalOver60Cr: round(rows.filter((r) => r.ageBucket === "61-90" || r.ageBucket === "90+").reduce((a, r) => a + r.units * r.unitValueLakh, 0) / 100, 1), slowSegment: slow.s, slowDays: Math.round(slow.d) }; };

// ---------- 9. historical interventions and matched controls ----------
const TYPES = ["Sales Training", "Inventory Rebalancing", "Customer Recovery", "Process Optimization", "Performance Monitoring"];
const BEST: Record<string, string[]> = { "Conversion / complaints": ["Sales Training", "Customer Recovery"], "CSI decline": ["Customer Recovery", "Process Optimization"], "Inventory ageing": ["Inventory Rebalancing"], "Payment delays": ["Performance Monitoring", "Process Optimization"], "Compliance gaps": ["Process Optimization", "Performance Monitoring"] };
const OWNERS = ["Regional Sales Head", "Inventory Planner", "CX Lead", "Dealer Principal", "Regional Manager"];
const drift = (b: number) => 0.6 + 0.04 * (68 - b);
const interventions: any[] = [];
const candidates = dealers.filter((d) => d.id !== hero.id && d.priority !== "Monitor");
for (let i = 0; i < 300; i++) {
  const dl = pick(candidates); const type = R() < 0.6 ? pick(BEST[dl.driver]) : pick(TYPES); const matched = BEST[dl.driver].includes(type);
  const effect = (matched ? 9 : 3.5) + gauss() * 3.2 + (dl.health < 60 ? 2 : 0);
  interventions.push({ id: `I-${String(i + 1).padStart(4, "0")}`, group: "treated", dealerId: dl.id, dealerName: dl.name, region: dl.region, driver: dl.driver, dealerTier: dl.tier, type, owner: pick(OWNERS), startDate: new Date(Date.UTC(2025, 9, 1) + int(0, 250) * 86400000).toISOString().slice(0, 10), durationDays: 90, status: R() < 0.78 ? "Completed" : "In progress", baselineHealth: dl.health, healthDelta: round(effect + drift(dl.health) + gauss() * 1.2, 1), conversionLiftPct: round((matched ? 14 : 3) + gauss() * 4, 1), complaintChangePct: round(-((matched ? 28 : 8) + gauss() * 8), 1), agedStockChangePct: round(type === "Inventory Rebalancing" ? -(30 + gauss() * 8) : -(5 + gauss() * 6), 1), matchedToDriver: matched, effective: effect >= 5 });
}
for (let i = 0; i < 300; i++) { const dl = pick(candidates); interventions.push({ id: `K-${String(i + 1).padStart(4, "0")}`, group: "control", dealerId: dl.id, dealerName: dl.name, region: dl.region, driver: dl.driver, baselineHealth: dl.health, healthDelta: round(drift(dl.health) + 2.6 * gauss(), 1) }); }
const treated = interventions.filter((i) => i.group === "treated" && i.status === "Completed"), control = interventions.filter((i) => i.group === "control");
const tm = mean(treated.map((i) => i.healthDelta)), cm = mean(control.map((i) => i.healthDelta));
const se = Math.sqrt(sd(treated.map((i) => i.healthDelta)) ** 2 / treated.length + sd(control.map((i) => i.healthDelta)) ** 2 / control.length);
const did = { treatedMeanDelta: round(tm, 1), controlMeanDelta: round(cm, 1), attributedDelta: round(tm - cm, 1), nTreated: treated.length, nControl: control.length, tStat: round((tm - cm) / se, 1), pValue: Math.max(0.0001, round(1 - erf(Math.abs((tm - cm) / se) / Math.SQRT2), 4)) };
const learningMatrix: any[] = [];
for (const drv of Object.keys(BEST)) for (const type of TYPES) {
  const rows = treated.filter((i) => i.driver === drv && i.type === type); if (!rows.length) continue;
  learningMatrix.push({ driver: drv, type, n: rows.length, meanHealthDelta: round(mean(rows.map((r) => r.healthDelta)) - cm, 1), successRate: round(rows.filter((r) => r.effective).length / rows.length, 2), meanConversionLiftPct: round(mean(rows.map((r) => r.conversionLiftPct)), 1), meanComplaintChangePct: round(mean(rows.map((r) => r.complaintChangePct)), 1) });
}
const typeAgg: Record<string, any> = {}; for (const t of TYPES) { const rows = treated.filter((i) => i.type === t); typeAgg[t] = { agedChange: mean(rows.map((r) => r.agedStockChangePct)) }; }
const cell = (drv: string, rank: number) => learningMatrix.filter((m) => m.driver === drv && m.n >= 5).sort((a, b) => b.meanHealthDelta - a.meanHealthDelta)[rank];

// ---------- 10. per-dealer insights for the intervention queue ----------
const queue = dealers.filter((d) => d.priority !== "Monitor");
const netMed = (f: (d: any) => number) => median(dealers.map(f));
const regMed = (region: string, f: (d: any) => number) => median(dealers.filter((d) => d.region === region).map(f));
const netComp = Object.fromEntries(COMP_KEYS.map((k) => [k, mean(salespeople.map((s) => s.competencies[k]))]));
const insComplaints: any = {}, insDiag: any = {}, insPlan: any = {};
for (const dl of queue) {
  const rows = complaints.filter((c) => c.dealerId === dl.id); const t = team(dl.id); const inv = invStats(dl.id);
  const themes = countBy(rows, (c) => c.theme); const cats = countBy(rows, (c) => c.category); const topTheme = topKey(themes) || "communication"; const topCat = topKey(cats) || "Communication";
  const flagged = t.filter((s) => s.flaggedForCoaching).map((s) => { const sr = rows.filter((c) => c.salespersonId === s.id); return { id: s.id, name: s.name, incidence: s.complaintIncidenceVsPeer, count: sr.length, topCategory: topKey(countBy(sr, (c) => c.category)) || "n/a" }; });
  const recent: any = {}; catList.forEach((cat) => (recent[cat] = rows.filter((c) => c.category === cat).slice(-2).reverse().map((c) => ({ id: c.id, date: c.date, text: c.text, severity: c.severity, theme: c.theme, salespersonId: c.salespersonId, salespersonName: c.salespersonName }))));
  const cs = cStats(rows);
  insComplaints[dl.id] = { people: t.map((s) => ({ id: s.id, name: s.name, incidence: s.complaintIncidenceVsPeer, counts: countBy(rows.filter((c) => c.salespersonId === s.id), (c) => c.category) })), matrix: matrix(rows), themes, flagged, recent, stats: cs, funnel: funnelOf(rows), focusSalespersonId: heroFocusId(dl.id) };
  // diagnosis
  const salesShare = Math.round(((rows.filter((c) => ROOT_GROUP[c.theme] === "Sales process gaps").length) / Math.max(1, rows.length)) * 100);
  const regC = regMed(dl.region, (d) => d.kpis.csi), regConv = regMed(dl.region, (d) => d.kpis.conversionPct);
  const lowConv = [...t].sort((a, b) => a.conversionPct - b.conversionPct).slice(0, 2);
  const teamComp = Object.fromEntries(COMP_KEYS.map((k) => [k, round(mean(t.map((s) => s.competencies[k])), 0)])) as any;
  const weakC = COMP_KEYS.reduce((a, b) => (teamComp[a] <= teamComp[b] ? a : b));
  const c1 = cell(dl.driver, 0), c2 = cell(dl.driver, 1);
  const rootGroups = countBy(rows, (c) => ROOT_GROUP[c.theme]); let cum = 0;
  const pareto = Object.entries(rootGroups).sort((a, b) => b[1] - a[1]).map(([n, v]) => { const share = round((v / Math.max(1, rows.length)) * 100, 0); cum += share; return { n, v: share, cum: Math.min(100, cum) }; });
  const stageShare = countBy(rows, (c) => c.journeyStage);
  const stageNames = ["Pre-sale", "Purchase", "Delivery", "Post-sale", "Service"];
  const f = dl.funnel, idx = (x: number) => round((x / f.leads) * 100, 1);
  const regD = dealers.filter((d) => d.region === dl.region);
  const bench = (g: (d: any) => number) => round(median(regD.map((d) => (g(d.funnel) / d.funnel.leads) * 100)), 1);
  const th = dl.trendPerQuarter;
  insDiag[dl.id] = {
    salesProcessShare: salesShare, topTheme, topCategory: topCat,
    chain: [
      { t: "Health deterioration", e: `Health score ${dl.health} (${th > 0 ? "+" : ""}${th} pts vs prior quarter). 90-day deterioration risk ${Math.round(dl.risk * 100)}%.` },
      { t: "Low CSI", e: `CSI ${dl.kpis.csi} versus regional median ${round(regC, 1)}. Customer Satisfaction dimension scores ${dl.dims.csat}.` },
      { t: "High complaint volume", e: `${dl.kpis.complaintsPer100} complaints per 100 sales (network median ${round(netMed((d) => d.kpis.complaintsPer100), 1)}). Largest category: ${topCat} (${Math.round(((cats[topCat] || 0) / Math.max(1, rows.length)) * 100)}%).` },
      { t: "Inventory ageing", e: `${inv.over60} units older than 60 days, ${inv.over90} older than 90 days. Average days to sale ${dl.kpis.avgDaysToSale} (network median ${netMed((d) => d.kpis.avgDaysToSale)}).` },
      { t: "Conversion decline", e: `Dealer conversion ${dl.kpis.conversionPct}% versus regional median ${round(regConv, 1)}%. Lowest converters: ${lowConv.map((s) => `${s.name} ${s.conversionPct}%`).join(", ")}.` },
      { t: "Sales process gap", e: `${salesShare}% of complaints trace to sales-process themes. Most frequent theme: ${topTheme}.` },
      { t: "Salesperson capability gap", e: flagged.length ? `${flagged.map((s) => s.name).join(", ")} ${flagged.length > 1 ? "have" : "has"} complaint incidence 1.5x or more of the peer median. Team is weakest on ${COMP_LABEL[weakC].toLowerCase()} (${teamComp[weakC]} vs network ${Math.round(netComp[weakC])}).` : `No individual outlier. Team is weakest on ${COMP_LABEL[weakC].toLowerCase()} (${teamComp[weakC]} vs network ${Math.round(netComp[weakC])}).` },
      { t: "Targeted intervention", e: c1 ? `Best historical response to "${dl.driver.toLowerCase()}": ${c1.type} (+${c1.meanHealthDelta} pts vs control, ${Math.round(c1.successRate * 100)}% success, ${c1.n} cases).` : "No comparable historical cases." },
    ],
    whys: [`Why is health ${dl.health} with a ${th} pt quarterly move? ${DIM_LABEL[dl.weakestDimension as DimKey]} is the weakest dimension (${dl.dims[dl.weakestDimension]}).`, ...WHY[topTheme]],
    fishbone: [
      ["People", [`Weakest team skill: ${COMP_LABEL[weakC].toLowerCase()} (${teamComp[weakC]} vs network ${Math.round(netComp[weakC])})`, `Training ${dl.kpis.trainingHours} h per person vs network ${round(netMed((d) => d.kpis.trainingHours), 0)} h`]],
      ["Process", [`Missing: ${PROC[topTheme]}`]],
      ["Product / Stock", [`${inv.over90} of ${inv.total} units aged 90+ days`, `Slowest segment: ${inv.slowSegment} (${inv.slowDays} days to sale)`]],
      ["Technology", [TECH[topTheme]]],
      ["Customer", [`Most complaints mention ${topKey(countBy(rows, (c) => c.model))}`, `${cs.repeatRatePct}% of complaints are repeats`]],
      ["Management", [th < 0 ? `Health fell ${Math.abs(th)} pts in a quarter without a weekly KPI review` : "Trend is stable; keep a monthly review"]],
    ],
    pareto,
    funnel: [{ n: "Leads", dealer: 100, bench: 100 }, { n: "Test drives", dealer: idx(f.testDrives), bench: bench((x) => x.testDrives) }, { n: "Quotes", dealer: idx(f.quotes), bench: bench((x) => x.quotes) }, { n: "Orders", dealer: idx(f.orders), bench: bench((x) => x.orders) }, { n: "Deliveries", dealer: idx(f.deliveries), bench: bench((x) => x.deliveries) }],
    gap: COMP_KEYS.map((k) => ({ n: COMP_LABEL[k], you: teamComp[k], bench: Math.round(netComp[k]) })),
    journey: stageNames.map((n) => ({ n, v: round(((stageShare[n] || 0) / Math.max(1, rows.length)) * 100, 0) })),
    workingCapital: [{ k: "Days to sale", v: `${dl.kpis.avgDaysToSale}`, s: `network median ${netMed((d) => d.kpis.avgDaysToSale)}` }, { k: "Days sales outstanding", v: `${dl.kpis.dsoDays}`, s: `network median ${netMed((d) => d.kpis.dsoDays)}` }, { k: "Stock aged 61+ days", v: `${inv.over60} units`, s: `₹${inv.capitalOver60Cr} Cr tied up` }, { k: "Margin", v: `${dl.kpis.marginPct}%`, s: `network median ${round(netMed((d) => d.kpis.marginPct), 1)}%` }],
    sevenS: [["Strategy", `Volume of ${dl.unitsPerMonth} units a month at ${dl.kpis.conversionPct}% conversion; no delivery-capacity check in targets`], ["Structure", `${t.length} salespeople, ${flagged.length} flagged; ownership gap: ${PROC[topTheme]}`], ["Systems", TECH[topTheme]], ["Shared values", `${dl.kpis.complaintsPer100} complaints per 100 sales vs network median ${round(netMed((d) => d.kpis.complaintsPer100), 1)}`], ["Skills", `${COMP_LABEL[weakC]} is the weakest team skill (${teamComp[weakC]})`], ["Staff", `Training ${dl.kpis.trainingHours} h per person vs network ${round(netMed((d) => d.kpis.trainingHours), 0)} h`], ["Style", th < 0 ? "Reactive: decline of " + Math.abs(th) + " pts was not caught early" : "Stable; periodic review"]],
  };
  // outcome simulation (projected 90-day result if the plan is executed)
  const hasInv = dl.driver === "Inventory ageing" || dl.kpis.inventoryOver90Pct > netMed((d) => d.kpis.inventoryOver90Pct);
  const eff = (c1 ? c1.meanHealthDelta : did.attributedDelta) + 0.35 * (c2 ? c2.meanHealthDelta : 0) + 1.2 * gauss();
  const cLift = (c1 ? c1.meanConversionLiftPct : 8) + 0.35 * (c2 ? c2.meanConversionLiftPct : 0);
  const cChg = (c1 ? c1.meanComplaintChangePct : -15) + 0.35 * (c2 ? c2.meanComplaintChangePct : 0);
  const agedChg = hasInv ? typeAgg["Inventory Rebalancing"].agedChange : typeAgg["Process Optimization"].agedChange;
  const after = { health: Math.min(98, Math.round(dl.health + eff + cm)), conversionPct: round(dl.kpis.conversionPct * (1 + cLift / 100), 1), complaintsPer100: round(dl.kpis.complaintsPer100 * (1 + cChg / 100), 1), unitsPerMonth: Math.round(dl.unitsPerMonth * (1 + (cLift / 100) * 0.8)), daysToSale: Math.round(dl.kpis.avgDaysToSale * (1 + (agedChg / 100) * 0.3)), aged90: round(inv.over90 * (1 + agedChg / 100), 1) };
  const before = { health: dl.health, conversionPct: dl.kpis.conversionPct, complaintsPer100: dl.kpis.complaintsPer100, unitsPerMonth: dl.unitsPerMonth, daysToSale: dl.kpis.avgDaysToSale, aged90: inv.over90 };
  const outcome = { before, after, healthDelta: after.health - before.health, attributedHealthDelta: round(eff, 1), conversionLiftPct: round(((after.conversionPct / before.conversionPct) - 1) * 100, 0), agedChangePct: round(((after.aged90 / Math.max(1, before.aged90)) - 1) * 100, 0), complaintChangePct: round(((after.complaintsPer100 / before.complaintsPer100) - 1) * 100, 0), basis: c1 ? `${c1.type}${c2 ? " + " + c2.type : ""}` : "network average" };
  const open = rows.filter((c) => c.closedOutcome === "Open").length;
  const nFl = flagged.length, tgtDts = Math.round(dl.kpis.avgDaysToSale * 0.85), hT = Math.min(95, after.health);
  const items: any[] = [];
  const add = (id: string, ws: string, name: string, s: number, e: number, owner: string, target: string, escalation = "") => items.push({ id: `${dl.id}-${id}`, workstream: ws, name, owner, start: s, end: e, target, escalation });
  if (nFl > 0) add("S1", "Sales Training", `AI Sales Coach practice sprints (${nFl} flagged ${nFl > 1 ? "salespeople" : "salesperson"})`, 1, 30, "Regional Sales Head", `Pitch score 85 or higher for all ${nFl}`, "Pitch score < 75 at Day 30");
  add("S2", "Sales Training", `${COMP_LABEL[weakC]} workshop for the sales team`, 8, 28, "OEM Trainer + Dealer Principal", `Team ${COMP_LABEL[weakC].toLowerCase()} ${teamComp[weakC]} to ${Math.min(85, teamComp[weakC] + 10)}`);
  if (nFl > 0) add("S3", "Sales Training", "Negotiation and empathy ride-along coaching", 31, 60, "Sales Manager", `Dealer conversion ${dl.kpis.conversionPct}% to ${after.conversionPct}%`);
  if (hasInv) { add("I1", "Inventory Rebalancing", "Transfer 61+ day stock to high-demand dealers", 5, 35, "Inventory Planner", `Units over 60 days: ${inv.over60} to ${Math.round(inv.over60 * 0.65)}`); add("I2", "Inventory Rebalancing", `Reduce future allocation of slow ${inv.slowSegment} variants`, 20, 60, "Allocation Manager", `Days to sale ${dl.kpis.avgDaysToSale} to ${tgtDts}`, `Days to sale above ${dl.kpis.avgDaysToSale - 2} at Day 60`); }
  add("C1", "Customer Recovery", `Contact all ${open} open complaints`, 1, 14, "CX Lead", "100% contacted within 7 days");
  add("C2", "Customer Recovery", "Recovery offers and close-out for stalled cases", 10, 45, "CX Lead", `Recovery rate ${Math.min(95, Math.round(cs.recoveryRatePct) + 10)}% or higher`);
  add("C3", "Customer Recovery", "Post-sale follow-up cadence (Day 3, 7, 30 calls)", 15, 75, "BDC Manager", "Follow-up compliance 95% or higher");
  add("P1", "Process Optimization", `Introduce ${PROC[topTheme]}`, 10, 40, "Dealer Principal", `No repeat complaints on ${topTheme}`);
  add("P2", "Process Optimization", TECH[topTheme], 30, 70, "OEM Digital Team", "Live for 100% of new orders");
  add("M1", "Performance Monitoring", "Weekly health-score and KPI review", 1, 90, "Regional Manager", `Health ${dl.health} to ${hT}`, `Health below ${dl.health + 3} at Day 45`);
  add("M2", "Performance Monitoring", "Escalation checkpoints and outcome tracking", 30, 90, "Regional Manager", "3 checkpoints held on schedule", "Missed checkpoint");
  insPlan[dl.id] = {
    plan: items, outcome,
    checkpoints: [{ day: 30, label: "Checkpoint 1", gate: `Coaching sprints complete; all ${open} open complaints contacted`, trigger: "Pitch score below 75 or any complaint older than 7 days" }, { day: 60, label: "Checkpoint 2", gate: `Stock moves done; conversion trending to ${round((dl.kpis.conversionPct + after.conversionPct) / 2, 1)}%+`, trigger: `Days to sale above ${dl.kpis.avgDaysToSale - 2} or health below ${Math.round((dl.health + hT) / 2)}` }, { day: 90, label: "Checkpoint 3", gate: "Outcome review against matched control dealers", trigger: `Health below ${hT - 3} triggers a second 90-day cycle` }],
  };
}

// ---------- 11. pitch sessions and coaching progress for every salesperson ----------
const BANK_COVER = (th: Record<string, number>) => { const top = Object.entries(th).sort((a, b) => b[1] - a[1]).slice(0, 3).reduce((a, [, v]) => a + v, 0); const tot = Object.values(th).reduce((a, b) => a + b, 0); return tot ? Math.round((top / tot) * 100) : 0; };
for (const s of salespeople) {
  const p = pitch[s.id]; const s1 = Math.round(mean(p.scores)); const rate = 0.3 + 0.15 * R(); const attempts = [s1];
  for (let k = 1; k < 5; k++) attempts.push(Math.min(95, Math.round(attempts[k - 1] + (92 - attempts[k - 1]) * rate * (0.8 + 0.4 * R()))));
  const gain = attempts[4] - attempts[0]; const comp2: any = { ...s.competencies };
  [...COMP_KEYS].sort((a, b) => comp2[a] - comp2[b]).slice(0, 2).forEach((k) => (comp2[k] = clamp(Math.round(comp2[k] + gain * 0.7), 0, 95)));
  const convAfter = round(s.conversionPct + (convOf(comp2) - convOf(s.competencies)), 1);
  Object.assign(p, { attempts, liftPts: gain, themeCoveragePct: BANK_COVER(s.complaintThemes), conversionBefore: s.conversionPct, conversionAfter: convAfter, conversionLiftPct: round((convAfter / s.conversionPct - 1) * 100, 0) });
}

// ---------- 12. model outputs, health scores, aggregates ----------
const dimMeans: any = {}; for (const k of DIM_KEYS) dimMeans[k] = mean(dealers.map((d) => d.dims[k]));
const shap: Record<string, any> = {}; const healthScores = dealers.map((d) => { const c: any = {}; for (const k of DIM_KEYS) c[k] = round(ML_W[k] * (d.dims[k] - dimMeans[k]), 2); shap[d.id] = c; return { dealerId: d.id, month: "2026-09", healthScore: d.health, healthScoreExpertWeights: d.healthExpert, status: d.status, dimensions: d.dims, deteriorationRisk90d: d.risk, trendPerQuarter: d.trendPerQuarter, regionalPercentile: d.regionalPercentile }; });
const modelOutputs = {
  label: "Prototype simulation - weights and risk probabilities are fitted on simulated history, not on validated real dealer outcomes.",
  dimensions: DIM_KEYS.map((k, i) => ({ key: k, label: DIM_LABEL[k], expertWeight: round(EXPERT_W[k] * 100, 0), mlWeight: round(wFit[i] * 100, 1), confidencePm: round(wCI[i], 1) })),
  weightFit: { method: "Non-negative OLS of simulated 12-month performance index on dimension scores, normalised to 100; 150 bootstrap resamples for the 95% range", nHistory: HIST.length, rSquared: round(r2, 3) },
  baselineHealth: round(wsum(dimMeans, ML_W), 1), shapContributions: shap,
  riskModel: { definition: "Logistic regression: probability of becoming At-Risk within 90 days", trainedOn: `${HIST.length} simulated dealer-quarters`, auc: round(auc, 3), eventRate: round(mean(histY), 3), priorityFormula: "Priority = Risk x Business Impact x Controllability", cutoffs: P_CUT },
  featureImportance: FEATS.map((f, j) => ({ feature: f, importance: round(impAbs[j] / impSum, 3), coefficient: round(lw[j], 3) })).sort((a, b) => b.importance - a.importance),
};
const statusShare = (r: string) => { const ds = dealers.filter((d) => d.region === r); const p = (s: string) => round((ds.filter((d) => d.status === s).length / ds.length) * 100, 0); return { region: r, healthy: p("Healthy"), watch: p("Watch"), atRisk: p("At-Risk"), n: ds.length }; };
const aggregates = {
  generatedFor: "Illustrative prototype data",
  meta: { heroDealerId: hero.id, heroSalespersonId: heroSp.id, priorityCutoffs: P_CUT },
  network: { dealers: dealers.length, criticalAlerts: dealers.filter((d) => d.status === "At-Risk" && d.risk >= 0.7).length, p1: dealers.filter((d) => d.priority === "P1").length, p2: dealers.filter((d) => d.priority === "P2").length, p3: dealers.filter((d) => d.priority === "P3").length, queue: queue.length },
  regionShares: REGIONS.map(statusShare),
  complaintMatrix: { all: matrix(complaints) },
  funnel: funnelOf(complaints), networkComplaintStats: cStats(complaints),
  classifierAccuracy: round(complaintsOut.filter((c) => classify(c.text).theme === c.theme).length / N, 3),
  peerMedianComplaintRatePer100: round(medianRate, 2),
  learningMatrix, did, healthTrend, totals: { complaints: N, salespeople: salespeople.length, dealers: dealers.length },
};

for (const s of salespeople) delete s._rate;
for (const d of dealers) delete d.weakestDimension;
const write = (f: string, o: any) => fs.writeFileSync(path.join(OUT, f), JSON.stringify(o));
write("dealers.json", dealers); write("dealer_monthly_metrics.json", monthly); write("salesperson.json", salespeople); write("complaints.json", complaintsOut);
write("inventory.json", inventory); write("interventions.json", interventions); write("health_scores.json", healthScores); write("model_outputs.json", modelOutputs); write("aggregates.json", aggregates);
write("insights_complaints.json", insComplaints); write("insights_diagnosis.json", insDiag); write("insights_plan.json", insPlan); write("pitch_sessions.json", pitch);
console.log({ dealers: dealers.length, monthly: monthly.length, salespeople: salespeople.length, complaints: N, inventory: inventory.length, interventions: interventions.length });
console.log("weights", modelOutputs.dimensions.map((d: any) => `${d.key} ${d.expertWeight}->${d.mlWeight}±${d.confidencePm}`).join(" | "), "R2", modelOutputs.weightFit.rSquared, "AUC", modelOutputs.riskModel.auc);
console.log("network", aggregates.network, "status", ["Healthy", "Watch", "At-Risk"].map((s) => dealers.filter((d) => d.status === s).length));
console.log("hero", hero.name, hero.health, hero.risk, hero.priority, hero.driver, "| focus", heroSp.name, heroSp.complaintIncidenceVsPeer, "conv", heroSp.conversionPct, "team conv", hero.kpis.conversionPct);
console.log("did", did, "net complaint stats", aggregates.networkComplaintStats, "funnel", aggregates.funnel.map((f) => f.pct));
console.log("hero outcome", insPlan[hero.id].outcome, "plan items", insPlan[hero.id].plan.length, "flagged", insComplaints[hero.id].flagged.length);
console.log("pitch hero", pitch[heroSp.id].scores, pitch[heroSp.id].drops.length, pitch[heroSp.id].attempts, pitch[heroSp.id].themeCoveragePct);
