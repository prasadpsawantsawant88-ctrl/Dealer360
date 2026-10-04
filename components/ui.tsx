"use client";
import { ReactNode, useEffect } from "react";
import { C, SOURCE_NOTE, ML_NOTE } from "@/lib/theme";
import { X } from "lucide-react";

export function Title({ lines, className = "" }: { lines: string[]; className?: string }) {
  return (
    <h1 className={`display relative text-[2.6rem] leading-[1.04] text-navy sm:text-6xl xl:text-[4.4rem] ${className}`}>
      <span aria-hidden className="absolute -left-3 top-[0.62em] -z-0 h-5 w-24 bg-steel/80" />
      {lines.map((l) => (<span key={l} className="relative block">{l}</span>))}
    </h1>
  );
}

/** Left: title + narrative. Right: primary chart/visual. */
export function Page({ title, lede, left, children, wide = false }: { title: string[]; lede?: ReactNode; left?: ReactNode; children?: ReactNode; wide?: boolean }) {
  return (
    <div className={`grid items-start gap-10 xl:gap-14 ${wide ? "xl:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]" : "xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"}`}>
      <section>
        <Title lines={title} />
        {lede && <p className="mt-8 max-w-md text-[15px] leading-relaxed text-navy/85">{lede}</p>}
        {left && <div className="mt-8">{left}</div>}
      </section>
      <section className="min-w-0">{children}</section>
    </div>
  );
}

export function Kpi({ value, label, tone = "red", small = false }: { value: ReactNode; label: string; tone?: "red" | "navy"; small?: boolean }) {
  return (
    <div>
      <div className={`display ${small ? "text-3xl" : "text-5xl"} ${tone === "red" ? "text-alert" : "text-navy"}`}>{value}</div>
      <div className="mt-1 text-[15px] text-navy">{label}</div>
    </div>
  );
}

export function KpiBullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-center gap-3 text-[15px] text-navy"><span aria-hidden className="h-3 w-3 shrink-0 rounded-full bg-alert" />{children}</li>
  );
}

export function Callout({ children }: { children: ReactNode }) {
  return <p className="border-l-2 border-steel pl-4 text-[15px] font-semibold leading-snug text-alert">{children}</p>;
}

export function Panel({ children, className = "", title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <div className={`rounded-sm border border-steel/70 bg-white p-5 ${className}`}>
      {title && <h3 className="mb-3 text-sm font-medium text-navy">{title}</h3>}
      {children}
    </div>
  );
}

export function Source({ ml = false }: { ml?: boolean }) {
  return <p className="mt-2 text-center text-[11px] text-navy/60">{ml ? ML_NOTE : SOURCE_NOTE}</p>;
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={active} className={`rounded-full border px-3 py-1 text-xs transition-colors ${active ? "border-navy bg-navy text-white" : "border-steel bg-white text-navy hover:border-navy"}`}>
      {children}
    </button>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="page-fade w-full max-w-lg rounded-sm bg-white p-6">
        <div className="mb-3 flex items-start justify-between gap-4">
          <h2 className="display text-2xl text-navy">{title}</h2>
          <button aria-label="Close" onClick={onClose} className="text-navy"><X size={20} /></button>
        </div>
        <div className="text-sm leading-relaxed text-navy/90">{children}</div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const cls = status === "Healthy" ? "text-navy bg-navy/10" : status === "Watch" ? "text-ink bg-steel/60" : "text-alert bg-alert/10";
  return <span className={`inline-block rounded-sm px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>;
}

export function PriorityBadge({ p }: { p: string }) {
  const cls = p === "P1" ? "bg-alert text-white" : p === "P2" ? "bg-navy text-white" : p === "P3" ? "bg-steel text-ink" : "border border-steel text-navy";
  return <span className={`inline-block rounded-sm px-2 py-0.5 text-xs font-medium ${cls}`}>{p === "Monitor" ? "Monitor" : p}</span>;
}

export const chartAxis = { tick: { fill: C.navy, fontSize: 12 }, axisLine: false as const, tickLine: false as const };

export function ChartTip({ active, payload, label, unit = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm border border-steel bg-white px-3 py-2 text-xs shadow-sm">
      {label !== undefined && <div className="mb-1 font-medium text-navy">{label}</div>}
      {payload.map((p: any) => (
        <div key={p.dataKey ?? p.name} className="flex items-center gap-2 text-navy">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          {p.name}: <b>{typeof p.value === "number" ? Math.round(p.value * 10) / 10 : p.value}{unit}</b>
        </div>
      ))}
    </div>
  );
}
