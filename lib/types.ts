export type Status = "Healthy" | "Watch" | "At-Risk";
export type Dims = { sales: number; csat: number; service: number; inventory: number; compliance: number };
export type Dealer = {
  id: string; name: string; region: string; city: string; tier: string;
  health: number; healthExpert: number; status: Status; risk: number; trendPerQuarter: number;
  dims: Dims; businessImpact: number; controllability: number; priorityScore: number;
  rank: number; priority: "P1" | "P2" | "P3" | "Monitor"; driver: string; driverNarrative: string; unitsPerMonth: number; regionalPercentile: number;
  kpis: {
    conversionPct: number; csi: number; complaintsPer100: number; inventoryOver90Pct: number; avgDaysToSale: number;
    dsoDays: number; marginPct: number; paymentDelayDays: number; resolutionDays: number; serviceRevenueIndex: number;
    salesGrowthPct: number; avgCompetency: number; trainingHours: number;
  };
};
export type Comp = { productKnowledge: number; customerRapport: number; closingSkills: number; objectionHandling: number; followUp: number };
export type Salesperson = {
  id: string; name: string; dealerId: string; dealerName: string; role: string; tenureMonths: number; unitsSold12m: number;
  conversionPct: number; competencies: Comp; avgCompetency: number; weakestCompetency: keyof Comp; trainingHours12m: number;
  complaintRatePer100: number; complaintCount: number; complaintIncidenceVsPeer: number; flaggedForCoaching: boolean;
  complaintThemes: Record<string, number>;
};
export type PlanItem = { id: string; workstream: string; name: string; owner: string; start: number; end: number; target: string; escalation: string };
export type PitchSession = {
  scores: number[]; drops: { minute: number; from: number; to: number; skill: string; subFrom: number; subTo: number; why: string[] }[];
  attempts: number[]; liftPts: number; themeCoveragePct: number; conversionBefore: number; conversionAfter: number; conversionLiftPct: number;
};
