"use client";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Page, Kpi, Panel, Source, Chip, ChartTip, chartAxis } from "@/components/ui";
import { C } from "@/lib/theme";
import { dealers } from "@/lib/data";
import { DealerPicker, useSelection } from "@/components/Selection";
import inventoryJson from "@/data/inventory.json";

type Row = { dealerId: string; segment: string; ageBucket: string; units: number; unitValueLakh: number };
const rows = inventoryJson as unknown as Row[];
const SEGS = ["Sedan", "SUV", "Truck", "EV"];
const BUCKETS = ["0-30", "31-60", "61-90", "90+"];
const SEG_COLOR: Record<string, string> = { Sedan: C.red, SUV: C.navy, Truck: C.steel, EV: C.steelDark };

export default function Inventory() {
  const { queuedId } = useSelection();
  const [dealerId, setDealerId] = useState(queuedId);
  useEffect(() => setDealerId(queuedId), [queuedId]);
  const [mode, setMode] = useState<"current" | "projected">("projected");
  const [A, setA] = useState({ on: true, pct: 60 });
  const [B, setB] = useState({ on: false, pct: 20 });
  const [Cc, setCc] = useState({ on: false, pct: 5 });
  const dealer = dealers.find((d) => d.id === dealerId);
  const scoped = useMemo(() => rows.filter((r) => dealerId === "ALL" || r.dealerId === dealerId), [dealerId]);
  const baseDts = dealerId === "ALL" ? Math.round(dealers.reduce((a, d) => a + d.kpis.avgDaysToSale, 0) / dealers.length) : dealer!.kpis.avgDaysToSale;

  const sim = useMemo(() => {
    let risk = 0, riskP = 0, capital = 0, margin = 0;
    const cur: any[] = BUCKETS.map((b) => ({ bucket: `${b} days` }));
    const prj: any[] = BUCKETS.map((b) => ({ bucket: `${b} days` }));
    for (const r of scoped) {
      const bi = BUCKETS.indexOf(r.ageBucket);
      let u = r.units;
      if (bi >= 2 && A.on) u *= 1 - (A.pct / 100) * 0.85;
      if (bi === 3 && Cc.on) u *= 1 - Math.min(0.9, Cc.pct * 0.11);
      if (bi === 2 && Cc.on) u *= 1 - Cc.pct * 0.03;
      if (bi <= 1 && B.on && (r.segment === "SUV" || r.segment === "Truck")) u *= 1 - (B.pct / 100) * 0.6;
      cur[bi][r.segment] = (cur[bi][r.segment] || 0) + r.units;
      prj[bi][r.segment] = Math.round(((prj[bi][r.segment] || 0) + u) * 10) / 10;
      if (bi >= 2) { risk += r.units; riskP += u; capital += (r.units - u) * r.unitValueLakh; if (bi === 3 && Cc.on) margin += (r.units - u) * r.unitValueLakh * (Cc.pct / 100); }
    }
    const removed = risk ? (risk - riskP) / risk : 0;
    const dts = Math.max(18, baseDts - 12 * removed - (B.on ? (B.pct / 100) * 8 : 0));
    return { cur, prj, risk, riskP, dts, capitalCr: capital / 100, marginLakh: margin };
  }, [scoped, A, B, Cc, baseDts]);

  const chart = mode === "current" ? sim.cur : sim.prj;
  const Slider = ({ label, sub, st, set, max, unit }: any) => (
    <Panel className={st.on ? "border-navy" : ""}>
      <label className="flex items-center gap-2 text-sm font-medium text-navy"><input type="checkbox" checked={st.on} onChange={(e) => set({ ...st, on: e.target.checked })} /> {label}</label>
      <p className="mt-1 text-xs text-navy/70">{sub}</p>
      <input aria-label={`${label} intensity`} type="range" min={0} max={max} value={st.pct} disabled={!st.on} onChange={(e) => set({ ...st, pct: Number(e.target.value) })} className="mt-3 w-full accent-[#285068]" />
      <div className="text-right text-xs text-navy">{st.pct}{unit}</div>
    </Panel>
  );

  return (
    <>
      <Page
        title={["Inventory", "Optimizer"]}
        lede="Simulate inventory rebalancing across the dealer network. Adjust the allocation mix to reduce ageing exposure and optimise projected days-to-sale by segment. Stock comes from the simulated September snapshot."
        left={
          <div className="space-y-6">
            <div className="flex gap-12">
              <Kpi value={Math.round(mode === "projected" ? sim.riskP : sim.risk)} label="Units at Risk (>60 days)" />
              <Kpi value={Math.round(mode === "projected" ? sim.dts : baseDts)} label="Avg Days to Sale" />
            </div>
            <DealerPicker allowAll value={dealerId} onChange={setDealerId} />
            <div className="flex gap-2"><Chip active={mode === "current"} onClick={() => setMode("current")}>Current</Chip><Chip active={mode === "projected"} onClick={() => setMode("projected")}>Projected</Chip></div>
          </div>
        }
      >
        <Panel>
          <div className="h-[340px]" role="img" aria-label="Grouped column chart of inventory units by age bucket and vehicle segment">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} barGap={2} barCategoryGap="14%" margin={{ left: -10 }}>
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="bucket" {...chartAxis} />
                <YAxis {...chartAxis} />
                <Tooltip content={<ChartTip unit=" units" />} cursor={{ fill: "rgba(40,80,104,0.06)" }} />
                <Legend verticalAlign="top" iconType="circle" />
                {SEGS.map((s) => (<Bar key={s} dataKey={s} name={`${s} Units`} fill={SEG_COLOR[s]} isAnimationActive={false} />))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Source />
        </Panel>
      </Page>
      <section className="mt-12" aria-label="Allocation scenarios">
        <h2 className="display mb-4 text-2xl text-navy">Allocation Scenario</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Slider label="Scenario A — Transfer ageing stock" sub="Move 61+ day units to dealers with demand." st={A} set={setA} max={100} unit="% of aged stock transferred" />
          <Slider label="Scenario B — Reduce future allocation" sub="Cut incoming SUV and Truck allocation." st={B} set={setB} max={50} unit="% allocation cut" />
          <Slider label="Scenario C — Targeted liquidation" sub="Discount 61+ day units to clear them." st={Cc} set={setCc} max={12} unit="% discount on aged units" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          {[["Units at risk", `${Math.round(sim.risk)} → ${Math.round(sim.riskP)}`], ["Days to sale", `${baseDts} → ${Math.round(sim.dts)}`], ["Capital released", `₹${sim.capitalCr.toFixed(1)} Cr`], ["Margin given up", `₹${sim.marginLakh.toFixed(1)} lakh`]].map(([k, v]) => (
            <Panel key={k}><div className="display text-2xl text-navy">{v}</div><div className="text-xs text-navy/70">{k}</div></Panel>
          ))}
        </div>
        <p className="mt-2 text-xs text-navy/70">Scenario effects are simple illustrative elasticities, not a fitted model.</p>
      </section>
    </>
  );
}
