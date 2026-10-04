import { jsPDF } from "jspdf";
import { aggregates, dealers, getDealer, salespeople, median, modelOutputs, DIM_LABELS, COMP_LABELS } from "@/lib/data";
import { DETAIL } from "@/lib/kpis";

type RGB = [number, number, number];
const NAVY: RGB = [40, 80, 104];
const RED: RGB = [216, 48, 56];
const STEEL: RGB = [192, 200, 208];
const INK: RGB = [20, 32, 43];
const PAPER: RGB = [248, 248, 248];
const MUTED: RGB = [96, 116, 130];

const PAGE_W = 210;
const PAGE_H = 297;
const M = 14;
const CW = PAGE_W - M * 2;
const TOP = 18;
const BOTTOM = PAGE_H - 18;

/** jsPDF's built-in fonts only cover Latin-1, so swap out anything outside it. */
const clean = (s: unknown) =>
  String(s ?? "")
    .replace(/[\u2212\u2013\u2014]/g, "-")
    .replace(/\u2192/g, " to ")
    .replace(/\u2264/g, "<=")
    .replace(/\u2265/g, ">=")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\x09\x0A\x20-\x7E\xA0-\xFF]/g, "");

type Cell = string | { t: string; color?: RGB; bold?: boolean };
type Col = { label: string; w: number; align?: "left" | "right" | "center" };

export async function buildDealerReport(dealerId: string): Promise<jsPDF> {
  const d = getDealer(dealerId);
  const [complaintsMod, inventoryMod, diagMod, planMod] = await Promise.all([
    import("@/data/complaints.json"),
    import("@/data/inventory.json"),
    import("@/data/insights_diagnosis.json"),
    import("@/data/insights_plan.json"),
  ]);
  const complaints = (complaintsMod.default as any[]).filter((c) => c.dealerId === d.id);
  const inventory = (inventoryMod.default as any[]).filter((r) => r.dealerId === d.id);
  const diagnosis = (diagMod.default as any)[d.id];
  const plan = (planMod.default as any)[d.id]?.plan as any[] | undefined;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setProperties({ title: `Dealer360 report - ${d.name}`, subject: "Dealer performance report", author: "Dealer360" });
  let y = TOP;

  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const ink = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const font = (size: number, bold = false) => { doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size); };
  const ensure = (h: number) => { if (y + h > BOTTOM) { doc.addPage(); y = TOP; } };

  const heading = (text: string, need = 20) => {
    ensure(Math.min(need, BOTTOM - TOP - 8) + 8);
    y += 4;
    fill(RED); doc.rect(M, y - 4.2, 1.6, 6, "F");
    font(12.5, true); ink(NAVY); doc.text(clean(text), M + 4, y);
    y += 7;
  };
  const para = (text: string, o: { size?: number; color?: RGB; bold?: boolean; w?: number; x?: number; lh?: number } = {}) => {
    const size = o.size ?? 9.5; const lh = o.lh ?? size * 0.45;
    font(size, o.bold); ink(o.color ?? INK);
    const lines = doc.splitTextToSize(clean(text), o.w ?? CW) as string[];
    for (const l of lines) { ensure(lh + 1); doc.text(l, o.x ?? M, y); y += lh; }
    y += 1.2;
  };

  const layout = (cols: Col[], rows: Cell[][], size: number) => {
    const pad = 1.8; const lh = size * 0.42;
    const total = cols.reduce((a, c) => a + c.w, 0); const k = CW / total;
    const widths = cols.map((c) => c.w * k);
    font(size);
    const wrapped = rows.map((r) => r.map((cell, i) => doc.splitTextToSize(clean(typeof cell === "string" ? cell : cell.t), widths[i] - pad * 2) as string[]));
    const heights = wrapped.map((w) => Math.max(...w.map((x) => x.length)) * lh + 2.6);
    return { pad, lh, widths, wrapped, heights, total: 5.4 + heights.reduce((a, b) => a + b, 0) };
  };
  const table = (cols: Col[], rows: Cell[][], o: { size?: number } = {}) => {
    const size = o.size ?? 8.5;
    const { pad, lh, widths, wrapped, heights, total } = layout(cols, rows, size);
    if (total <= 90 && y - 4 + total > BOTTOM) { doc.addPage(); y = TOP; }
    const drawHeader = () => {
      ensure(9);
      fill(NAVY); doc.rect(M, y - 4.2, CW, 6.4, "F");
      font(size, true); ink([255, 255, 255]);
      let x = M;
      cols.forEach((c, i) => {
        const tx = c.align === "right" ? x + widths[i] - pad : c.align === "center" ? x + widths[i] / 2 : x + pad;
        doc.text(clean(c.label), tx, y, { align: c.align ?? "left" });
        x += widths[i];
      });
      y += 5.4;
    };
    drawHeader();
    rows.forEach((r, ri) => {
      const rh = heights[ri];
      if (y - 4 + rh > BOTTOM) { doc.addPage(); y = TOP; drawHeader(); }
      if (ri % 2 === 0) { fill(PAPER); doc.rect(M, y - 3.8, CW, rh, "F"); }
      let x = M;
      r.forEach((cell, i) => {
        const o2 = typeof cell === "string" ? {} : cell;
        font(size, !!(o2 as any).bold); ink((o2 as any).color ?? INK);
        const tx = cols[i].align === "right" ? x + widths[i] - pad : cols[i].align === "center" ? x + widths[i] / 2 : x + pad;
        wrapped[ri][i].forEach((line, li) => doc.text(line, tx, y + li * lh, { align: cols[i].align ?? "left" }));
        x += widths[i];
      });
      stroke(STEEL); doc.setLineWidth(0.1); doc.line(M, y - 3.8 + rh, M + CW, y - 3.8 + rh);
      y += rh;
    });
    y += 2;
  };

  /* ---------- Cover band ---------- */
  fill(NAVY); doc.rect(0, 0, PAGE_W, 44, "F");
  fill(RED); doc.rect(0, 44, 70, 1.6, "F");
  font(10, true); ink([255, 255, 255]); doc.text("DEALER360  |  DEALER PERFORMANCE REPORT", M, 14);
  font(24, true); doc.text(clean(d.name), M, 27);
  font(10.5); ink([220, 228, 235]);
  doc.text(clean(`${d.id}  |  ${d.city}, ${d.region} region  |  Tier ${d.tier}`), M, 35);
  const stamp = new Date();
  const dateLabel = stamp.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  font(9); doc.text(`Generated ${dateLabel}`, PAGE_W - M, 14, { align: "right" });
  y = 56;

  /* ---------- KPI tiles ---------- */
  const statusColor = d.status === "Healthy" ? NAVY : RED;
  const tiles: { label: string; value: string; sub: string; color: RGB }[] = [
    { label: "HEALTH SCORE", value: `${d.health}`, sub: `/ 100  (${d.status})`, color: statusColor },
    { label: "TREND", value: `${d.trendPerQuarter > 0 ? "+" : ""}${d.trendPerQuarter}`, sub: "pts vs prior quarter", color: d.trendPerQuarter < 0 ? RED : NAVY },
    { label: "90-DAY RISK", value: `${Math.round(d.risk * 100)}%`, sub: "deterioration", color: d.risk >= 0.4 ? RED : NAVY },
    { label: "PRIORITY", value: d.priority === "Monitor" ? "Monitor" : d.priority, sub: `rank ${d.rank} of ${dealers.length}`, color: d.priority === "P1" ? RED : NAVY },
    { label: "REGIONAL RANK", value: `P${d.regionalPercentile}`, sub: "percentile in region", color: NAVY },
  ];
  const tw = (CW - 4 * 3) / 5;
  tiles.forEach((t, i) => {
    const x = M + i * (tw + 3);
    fill([255, 255, 255]); stroke(STEEL); doc.setLineWidth(0.25); doc.roundedRect(x, y, tw, 24, 1, 1, "FD");
    fill(t.color); doc.rect(x, y, tw, 1.2, "F");
    font(7, true); ink(MUTED); doc.text(t.label, x + 3, y + 7);
    font(t.value.length > 5 ? 14 : 19, true); ink(t.color); doc.text(clean(t.value), x + 3, y + 16);
    font(7); ink(MUTED); doc.text(clean(t.sub), x + 3, y + 21);
  });
  y += 32;

  const yNarr = y;
  para(d.driverNarrative, { size: 10, color: RED, bold: true, w: CW - 6, x: M + 4 });
  stroke(STEEL); doc.setLineWidth(0.6); doc.line(M + 1, yNarr - 3.5, M + 1, y - 3);
  y += 1.5;
  para(`Primary driver: ${d.driver}. Business impact ${Math.round(d.businessImpact * 100)}%, controllability ${Math.round(d.controllability * 100)}%, priority score ${d.priorityScore}.`, { size: 9, color: MUTED });

  /* ---------- Dimension scores ---------- */
  const peers = dealers.filter((x) => x.region === d.region);
  const dimKeys = Object.keys(DIM_LABELS);
  heading("Dimension scores vs regional median");
  ensure(dimKeys.length * 9 + 10);
  dimKeys.forEach((k) => {
    const v = (d.dims as any)[k] as number;
    const med = Math.round(median(peers.map((p) => (p.dims as any)[k])));
    const bx = M + 52; const bw = 98;
    font(9); ink(INK); doc.text(clean(DIM_LABELS[k]), M, y + 3);
    fill([236, 240, 244]); doc.rect(bx, y, bw, 3.6, "F");
    fill(v < 65 ? RED : NAVY); doc.rect(bx, y, (bw * v) / 100, 3.6, "F");
    stroke(INK); doc.setLineWidth(0.5); doc.line(bx + (bw * med) / 100, y - 1, bx + (bw * med) / 100, y + 4.6);
    font(9, true); ink(v < 65 ? RED : NAVY); doc.text(`${v}`, bx + bw + 4, y + 3);
    font(8); ink(MUTED); doc.text(`median ${med}`, bx + bw + 13, y + 3);
    y += 8.5;
  });
  font(7.5); ink(MUTED); doc.text("Bar = dealer score (red below 65). Black tick = regional median.", M, y + 1);
  y += 6;

  /* ---------- Trend chart ---------- */
  const trend = aggregates.healthTrend[d.id].slice(-12);
  heading("12-month health trend");
  ensure(62);
  {
    const cx = M + 10, cy = y + 2, cw = CW - 14, ch = 44;
    const vals = trend.map((t) => t.health);
    const lo = Math.floor(Math.min(...vals, 60) / 10) * 10 - 0; const hi = Math.ceil(Math.max(...vals, 70) / 10) * 10;
    const sx = (i: number) => cx + (cw * i) / (trend.length - 1);
    const sy = (v: number) => cy + ch - ((v - lo) / (hi - lo)) * ch;
    stroke([220, 225, 231]); doc.setLineWidth(0.15);
    for (let g = lo; g <= hi; g += 10) { doc.line(cx, sy(g), cx + cw, sy(g)); font(7); ink(MUTED); doc.text(`${g}`, cx - 2, sy(g) + 1, { align: "right" }); }
    stroke(RED); doc.setLineWidth(0.3); doc.setLineDashPattern([1.5, 1.2], 0); doc.line(cx, sy(65), cx + cw, sy(65)); doc.setLineDashPattern([], 0);
    font(7); ink(RED); doc.text("At-Risk below 65", cx + cw, sy(65) - 1, { align: "right" });
    stroke(NAVY); doc.setLineWidth(0.7);
    for (let i = 1; i < trend.length; i++) doc.line(sx(i - 1), sy(vals[i - 1]), sx(i), sy(vals[i]));
    trend.forEach((t, i) => {
      fill(NAVY); doc.circle(sx(i), sy(vals[i]), 0.9, "F");
      if (i % 2 === 0 || i === trend.length - 1) { font(7); ink(MUTED); doc.text(t.month.slice(2), sx(i), cy + ch + 5, { align: "center" }); }
    });
    const last = trend[trend.length - 1];
    font(8, true); ink(NAVY); doc.text(`${last.health}`, sx(trend.length - 1), sy(last.health) - 2.5, { align: "center" });
    y = cy + ch + 9;
  }

  /* ---------- KPI table ---------- */
  heading("KPI analysis vs regional median", 40);
  const kpiRows: Cell[][] = [];
  Object.keys(DETAIL).forEach((dim) => {
    DETAIL[dim].forEach((k, i) => {
      const val = k.get(d); const med = median(peers.map((p) => k.get(p)));
      const worse = k.lowerBetter ? val > med : val < med;
      kpiRows.push([
        i === 0 ? { t: DIM_LABELS[dim], bold: true, color: NAVY } : "",
        k.label,
        { t: k.fmt(val), bold: true, color: worse ? RED : NAVY },
        k.fmt(med),
        { t: worse ? "Behind" : "Ahead", color: worse ? RED : NAVY },
      ]);
    });
  });
  table(
    [{ label: "Dimension", w: 30 }, { label: "KPI", w: 52 }, { label: "Dealer", w: 22, align: "right" }, { label: "Regional median", w: 28, align: "right" }, { label: "Position", w: 20, align: "center" }],
    kpiRows,
  );

  /* ---------- Score contribution ---------- */
  const shap = modelOutputs.shapContributions?.[d.id] as Record<string, number> | undefined;
  if (shap) {
    heading("What moves the health score", 55);
    para(`Contribution of each dimension to the score compared with the sample average of ${modelOutputs.baselineHealth}. These come from a simulated model and illustrate the method.`, { size: 8.5, color: MUTED });
    table(
      [{ label: "Dimension", w: 70 }, { label: "Contribution (points)", w: 40, align: "right" }],
      Object.keys(shap).map((k) => [DIM_LABELS[k] ?? k, { t: `${shap[k] > 0 ? "+" : ""}${shap[k]}`, bold: true, color: shap[k] < 0 ? RED : NAVY }]),
    );
  }

  /* ---------- Diagnosis ---------- */
  if (diagnosis?.chain?.length) {
    heading("Diagnosis chain", diagnosis.chain.length * 10 + 14);
    table(
      [{ label: "#", w: 6, align: "center" }, { label: "Finding", w: 40 }, { label: "Evidence", w: 130 }],
      diagnosis.chain.map((c: any, i: number) => [`${i + 1}`, { t: c.t, bold: true, color: NAVY }, c.e]),
    );
    if (diagnosis.whys?.length) {
      para("Root cause, asked step by step", { size: 9.5, bold: true, color: NAVY });
      diagnosis.whys.forEach((w: string, i: number) => para(`${i + 1}. ${w}`, { size: 9 }));
    }
  }

  /* ---------- Complaints ---------- */
  heading("Customer complaints", 62);
  if (!complaints.length) {
    para("No complaints on record for this dealer.");
  } else {
    const count = (key: string) => {
      const m = new Map<string, number>();
      complaints.forEach((c) => m.set(c[key], (m.get(c[key]) ?? 0) + 1));
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };
    const repeat = complaints.filter((c) => c.isRepeat).length;
    const recovered = complaints.filter((c) => c.closedOutcome === "Recovered").length;
    const lost = complaints.filter((c) => c.closedOutcome === "Lost").length;
    const open = complaints.filter((c) => c.closedOutcome === "Open").length;
    const resolved = complaints.map((c) => c.resolutionDays).filter((v) => typeof v === "number") as number[];
    const avgRes = resolved.length ? resolved.reduce((a, b) => a + b, 0) / resolved.length : null;
    const critical = complaints.filter((c) => c.severity === "Critical" || c.severity === "At-Risk").length;
    para(
      `${complaints.length} complaints on record (${d.kpis.complaintsPer100} per 100 sales; network median ${aggregates.peerMedianComplaintRatePer100}). ` +
        `${recovered} customers recovered, ${lost} lost, ${open} still open. ${repeat} were repeat complaints. ` +
        `${critical} were rated At-Risk or Critical.` + (avgRes !== null ? ` Average resolution time: ${avgRes.toFixed(1)} days.` : ""),
    );
    const cats = count("category"); const themes = count("theme").slice(0, 6);
    const rows: Cell[][] = [];
    for (let i = 0; i < Math.max(cats.length, themes.length); i++) {
      rows.push([
        cats[i] ? cats[i][0] : "", cats[i] ? { t: `${cats[i][1]} (${Math.round((cats[i][1] / complaints.length) * 100)}%)`, bold: true } : "",
        themes[i] ? themes[i][0] : "", themes[i] ? { t: `${themes[i][1]}`, bold: true } : "",
      ]);
    }
    table([{ label: "Category", w: 40 }, { label: "Count", w: 25, align: "right" }, { label: "Top themes", w: 45 }, { label: "Count", w: 20, align: "right" }], rows);
  }

  /* ---------- Salespeople ---------- */
  const team = salespeople.filter((s) => s.dealerId === d.id).sort((a, b) => b.complaintIncidenceVsPeer - a.complaintIncidenceVsPeer);
  heading(`Sales team (${team.length})`, team.length * 9 + 34);
  if (!team.length) {
    para("No salespeople on record for this dealer.");
  } else {
    const flagged = team.filter((s) => s.flaggedForCoaching);
    para(
      `${flagged.length} of ${team.length} salespeople are flagged for coaching. ` +
        `Team average competency is ${(team.reduce((a, s) => a + s.avgCompetency, 0) / team.length).toFixed(1)}. ` +
        `Complaint incidence compares each person with peers (1.0 is the peer average).`,
    );
    table(
      [{ label: "Name", w: 30 }, { label: "Role", w: 30 }, { label: "Conv.", w: 14, align: "right" }, { label: "Avg skill", w: 16, align: "right" }, { label: "Weakest skill", w: 32 }, { label: "Complaints", w: 18, align: "right" }, { label: "vs peers", w: 15, align: "right" }, { label: "Coaching", w: 18, align: "center" }],
      team.map((s) => [
        { t: s.name, bold: s.flaggedForCoaching },
        s.role,
        `${s.conversionPct}%`,
        `${s.avgCompetency}`,
        `${COMP_LABELS[s.weakestCompetency]} (${s.competencies[s.weakestCompetency]})`,
        `${s.complaintCount}`,
        { t: `${s.complaintIncidenceVsPeer.toFixed(2)}x`, color: s.complaintIncidenceVsPeer > 1.3 ? RED : INK, bold: s.complaintIncidenceVsPeer > 1.3 },
        { t: s.flaggedForCoaching ? "Flagged" : "-", color: s.flaggedForCoaching ? RED : MUTED, bold: s.flaggedForCoaching },
      ]),
      { size: 8 },
    );
  }

  /* ---------- Inventory ---------- */
  heading("Inventory", 66);
  if (!inventory.length) {
    para("No stock snapshot on record for this dealer.");
  } else {
    const buckets = ["0-30", "31-60", "61-90", "90+"];
    const units = (b: string) => inventory.filter((r) => r.ageBucket === b).reduce((a, r) => a + r.units, 0);
    const value = (b: string) => inventory.filter((r) => r.ageBucket === b).reduce((a, r) => a + r.units * r.unitValueLakh, 0);
    const totalUnits = buckets.reduce((a, b) => a + units(b), 0); const totalValue = buckets.reduce((a, b) => a + value(b), 0);
    para(`Stock snapshot ${inventory[0].snapshot}: ${totalUnits} units worth Rs ${totalValue.toFixed(1)} lakh. ${units("90+")} units (${totalUnits ? Math.round((units("90+") / totalUnits) * 100) : 0}%) are older than 90 days.`);
    table(
      [{ label: "Age bucket (days)", w: 40 }, { label: "Units", w: 25, align: "right" }, { label: "Share", w: 25, align: "right" }, { label: "Value (Rs lakh)", w: 35, align: "right" }],
      buckets.map((b) => [
        { t: b, bold: b === "90+", color: b === "90+" ? RED : INK }, `${units(b)}`,
        `${totalUnits ? Math.round((units(b) / totalUnits) * 100) : 0}%`, value(b).toFixed(1),
      ]),
    );
    const segs = [...new Set(inventory.map((r) => r.segment))];
    const segRows = segs.map((sg) => {
      const rs = inventory.filter((r) => r.segment === sg);
      return [sg, `${rs.reduce((a, r) => a + r.units, 0)}`, `${Math.round(rs.reduce((a, r) => a + r.avgDaysToSale, 0) / rs.length)}`] as Cell[];
    });
    table([{ label: "Segment", w: 40 }, { label: "Units", w: 25, align: "right" }, { label: "Avg days to sale", w: 35, align: "right" }], segRows);
  }

  /* ---------- Action plan ---------- */
  heading("90-day action plan", (plan?.length ?? 1) * 11 + 16);
  if (!plan?.length) {
    para(d.priority === "Monitor" ? "This dealer is on Monitor status, so no intervention plan has been generated." : "No action plan is available for this dealer.");
  } else {
    table(
      [{ label: "Workstream", w: 28 }, { label: "Action", w: 55 }, { label: "Owner", w: 30 }, { label: "Days", w: 14, align: "center" }, { label: "Target", w: 45 }],
      [...plan].sort((a, b) => a.start - b.start).map((p) => [{ t: p.workstream, bold: true, color: NAVY }, p.name, p.owner, `${p.start}-${p.end}`, p.target + (p.escalation ? ` (Escalate: ${p.escalation})` : "")]),
      { size: 8 },
    );
  }

  /* ---------- Footer on every page ---------- */
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    stroke(STEEL); doc.setLineWidth(0.2); doc.line(M, PAGE_H - 12, PAGE_W - M, PAGE_H - 12);
    font(7.5); ink(MUTED);
    doc.text(`Dealer360  |  ${clean(d.name)} (${d.id})  |  Illustrative prototype data, not a production system`, M, PAGE_H - 8);
    doc.text(`Page ${i} of ${pages}`, PAGE_W - M, PAGE_H - 8, { align: "right" });
  }
  return doc;
}

export function reportFileName(dealerId: string) {
  const d = getDealer(dealerId);
  const day = new Date().toISOString().slice(0, 10);
  return `Dealer360_Report_${d.name.replace(/[^A-Za-z0-9]+/g, "_")}_${d.id}_${day}.pdf`;
}

export async function downloadDealerReport(dealerId: string) {
  const doc = await buildDealerReport(dealerId);
  doc.save(reportFileName(dealerId));
}
