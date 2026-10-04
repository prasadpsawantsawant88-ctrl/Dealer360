export const pct = (x: number, d = 0) => `${(x * 100).toFixed(d)}%`;
export const statusColor = (s: string) => (s === "Healthy" ? "text-navy bg-navy/10" : s === "Watch" ? "text-ink bg-steel/50" : "text-alert bg-alert/10");
