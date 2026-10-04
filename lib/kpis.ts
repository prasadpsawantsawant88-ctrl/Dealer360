export const DETAIL: Record<string, { label: string; get: (d: any) => number; fmt: (v: number) => string; lowerBetter?: boolean }[]> = {
  sales: [
    { label: "Conversion rate", get: (d) => d.kpis.conversionPct, fmt: (v) => `${v.toFixed(1)}%` },
    { label: "Units per month", get: (d) => d.unitsPerMonth, fmt: (v) => `${Math.round(v)}` },
    { label: "Sales growth YoY", get: (d) => d.kpis.salesGrowthPct, fmt: (v) => `${v.toFixed(1)}%` },
  ],
  csat: [
    { label: "CSI score", get: (d) => d.kpis.csi, fmt: (v) => v.toFixed(1) },
    { label: "Complaints per 100 sales", get: (d) => d.kpis.complaintsPer100, fmt: (v) => v.toFixed(1), lowerBetter: true },
    { label: "Avg resolution (days)", get: (d) => d.kpis.resolutionDays, fmt: (v) => v.toFixed(1), lowerBetter: true },
  ],
  inventory: [
    { label: "Stock aged 90+ days", get: (d) => d.kpis.inventoryOver90Pct, fmt: (v) => `${v.toFixed(1)}%`, lowerBetter: true },
    { label: "Avg days to sale", get: (d) => d.kpis.avgDaysToSale, fmt: (v) => `${Math.round(v)}`, lowerBetter: true },
  ],
  service: [
    { label: "Service revenue index", get: (d) => d.kpis.serviceRevenueIndex, fmt: (v) => `${Math.round(v)}` },
    { label: "Days sales outstanding", get: (d) => d.kpis.dsoDays, fmt: (v) => `${Math.round(v)}`, lowerBetter: true },
    { label: "Margin", get: (d) => d.kpis.marginPct, fmt: (v) => `${v.toFixed(1)}%` },
    { label: "Payment delay (days)", get: (d) => d.kpis.paymentDelayDays, fmt: (v) => v.toFixed(1), lowerBetter: true },
  ],
  compliance: [
    { label: "Training hours per person", get: (d) => d.kpis.trainingHours, fmt: (v) => v.toFixed(0) },
    { label: "Avg competency score", get: (d) => d.kpis.avgCompetency, fmt: (v) => v.toFixed(1) },
  ],
};
