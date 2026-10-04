import dealersJson from "@/data/dealers.json";
import salesJson from "@/data/salesperson.json";
import aggJson from "@/data/aggregates.json";
import modelJson from "@/data/model_outputs.json";
import type { Dealer, Salesperson } from "./types";

export const dealers = dealersJson as unknown as Dealer[];
export const salespeople = salesJson as unknown as Salesperson[];
export const modelOutputs = modelJson as any;
export const aggregates = aggJson as unknown as {
  meta: { heroDealerId: string; heroSalespersonId: string; priorityCutoffs: { P1: number; P2: number; P3: number } };
  network: { dealers: number; criticalAlerts: number; p1: number; p2: number; p3: number; queue: number };
  regionShares: { region: string; healthy: number; watch: number; atRisk: number; n: number }[];
  complaintMatrix: { all: any[] };
  funnel: { stage: string; count: number; pct: number }[];
  networkComplaintStats: { n: number; resolutionRatePct: number; repeatRatePct: number; recoveryRatePct: number; avgResolutionDays: number };
  classifierAccuracy: number;
  peerMedianComplaintRatePer100: number;
  learningMatrix: { driver: string; type: string; n: number; meanHealthDelta: number; successRate: number; meanConversionLiftPct: number; meanComplaintChangePct: number }[];
  did: { treatedMeanDelta: number; controlMeanDelta: number; attributedDelta: number; nTreated: number; nControl: number; tStat: number; pValue: number };
  healthTrend: Record<string, { month: string; health: number }[]>;
  totals: { complaints: number; salespeople: number; dealers: number };
};

export const HERO_ID = aggregates.meta.heroDealerId;
export const HERO_SP_ID = aggregates.meta.heroSalespersonId;
export const getDealer = (id: string) => dealers.find((d) => d.id === id) ?? dealers.find((d) => d.id === HERO_ID)!;
export const getSalesperson = (id: string) => salespeople.find((s) => s.id === id) ?? salespeople.find((s) => s.id === HERO_SP_ID)!;
export const focusSalesperson = (dealerId: string) => [...salespeople.filter((s) => s.dealerId === dealerId)].sort((a, b) => b.complaintIncidenceVsPeer - a.complaintIncidenceVsPeer)[0];
export const queueDealers = [...dealers].filter((d) => d.priority !== "Monitor").sort((a, b) => a.rank - b.rank);
export const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export const DIM_LABELS: Record<string, string> = { sales: "Sales Performance", csat: "Customer Satisfaction", service: "Service Revenue", inventory: "Inventory Health", compliance: "Compliance" };
export const COMP_LABELS: Record<string, string> = { productKnowledge: "Product Knowledge", customerRapport: "Customer Rapport", closingSkills: "Closing Skills", objectionHandling: "Objection Handling", followUp: "Follow-up" };
