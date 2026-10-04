import { Page, Panel } from "@/components/ui";
import { Mail, Globe } from "lucide-react";

const FLOW = [
  ["Dealer Data", "Dealer, market, customer and operations data"],
  ["Analytics Foundation", "KPI normalization, trend detection, benchmarking"],
  ["ML Scoring Engine", "Health score calibration, 90-day risk prediction, SHAP explanation"],
  ["Health & Risk", "Health score, status, deterioration risk, priority P1–P3"],
  ["Management Frameworks", "5 Whys, Fishbone, MECE, customer journey, 7S"],
  ["Diagnosis", "Evidence chain: systemic issue versus isolated incident"],
  ["Recommendation", "Next-best action ranked by expected impact"],
  ["Intervention Orchestration", "Sales Coach, Inventory Optimizer, Customer Recovery, Action Plan"],
  ["Outcome Tracking", "Difference-in-differences against matched dealers"],
  ["Learning Loop", "Recalibration of weights and action priorities"],
];
const LAYERS = [
  ["Analytics Foundation", "KPI normalization · Trend detection · Benchmarking"],
  ["ML Scoring", "Health score · Risk prediction · SHAP explanation"],
  ["Management Frameworks", "5 Whys · Fishbone · Sales Funnel · Competency Gap · Customer Journey · Working Capital"],
  ["Intervention Orchestration", "Actions · Owners · Targets · Tracking"],
];

export default function Methodology() {
  return (
    <>
      <Page
        title={["Methodology", "& Architecture"]}
        lede="Four integrated layers power Dealer360: Analytics Foundation (KPI normalization, trend detection), ML Scoring Engine (health scores, risk prediction), Management Frameworks (5 Whys, MECE diagnostics), and Intervention Orchestration (automated workflows, accountability tracking)."
        left={
          <div>
            <h3 className="text-base font-medium text-navy">Platform Support</h3>
            <p className="mt-3 flex items-center gap-2 text-sm text-navy"><Mail size={16} className="text-alert" /> dealer360-support@oem.com</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-navy"><Globe size={16} className="text-alert" /> dealer360.enterprise.com</p>
            <p className="mt-4 text-xs text-navy/60">Contact details are placeholders from the source walkthrough.</p>
          </div>
        }
      >
        <Panel>
          <ol className="grid gap-x-4 gap-y-1 sm:grid-cols-2" aria-label="Platform data flow">
            {FLOW.map(([t, s], i) => (
              <li key={t} className="relative">
                <div className="rounded-sm bg-navy p-3 text-white"><div className="text-sm font-semibold">{t}</div><div className="mt-0.5 text-[11px] leading-snug text-white/75">{s}</div></div>
                {i < FLOW.length - 1 && <div aria-hidden className="mx-auto h-3 w-0.5 bg-alert sm:hidden" />}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-center text-xs text-navy/70">Operating model: SENSE → ASSESS → DIAGNOSE → PRIORITISE → ACT → MEASURE → LEARN</p>
        </Panel>
      </Page>
      <section className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Four layers">
        {LAYERS.map(([t, s]) => (<Panel key={t}><h3 className="display text-xl text-navy">{t}</h3><p className="mt-2 text-sm text-navy/85">{s}</p></Panel>))}
      </section>
    </>
  );
}
