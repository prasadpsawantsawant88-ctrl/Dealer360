"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { HERO_ID, HERO_SP_ID, dealers, focusSalesperson, queueDealers, getSalesperson } from "@/lib/data";

type Sel = { dealerId: string; spId: string; setDealer: (id: string) => void; setSp: (id: string) => void; queuedId: string };
const Ctx = createContext<Sel>({ dealerId: HERO_ID, spId: HERO_SP_ID, setDealer: () => {}, setSp: () => {}, queuedId: HERO_ID });
const KEY = "d360_selection";

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [dealerId, setDealerId] = useState(HERO_ID);
  const [spId, setSpId] = useState(HERO_SP_ID);
  useEffect(() => { try { const s = JSON.parse(sessionStorage.getItem(KEY) || "null"); if (s?.dealerId) { setDealerId(s.dealerId); setSpId(s.spId); } } catch {} }, []);
  const save = (d: string, s: string) => { try { sessionStorage.setItem(KEY, JSON.stringify({ dealerId: d, spId: s })); } catch {} };
  const setDealer = useCallback((id: string) => { const sp = focusSalesperson(id)?.id ?? HERO_SP_ID; setDealerId(id); setSpId(sp); save(id, sp); }, []);
  const setSp = useCallback((id: string) => { const d = getSalesperson(id).dealerId; setSpId(id); setDealerId(d); save(d, id); }, []);
  const queuedId = queueDealers.some((d) => d.id === dealerId) ? dealerId : HERO_ID;
  return <Ctx.Provider value={{ dealerId, spId, setDealer, setSp, queuedId }}>{children}</Ctx.Provider>;
}
export const useSelection = () => useContext(Ctx);

export function DealerPicker({ allowAll = false, value, onChange, label = "Dealer" }: { allowAll?: boolean; value?: string; onChange?: (id: string) => void; label?: string }) {
  const sel = useSelection();
  const v = value ?? sel.queuedId;
  return (
    <label className="block text-xs text-navy/70">{label}
      <select value={v} onChange={(e) => (onChange ? onChange(e.target.value) : sel.setDealer(e.target.value))} className="mt-1 block w-full max-w-xs rounded-sm border border-steel bg-white px-2 py-2 text-sm text-navy">
        {allowAll && <option value="ALL">Whole network ({dealers.length} dealers)</option>}
        {queueDealers.map((d) => (<option key={d.id} value={d.id}>{d.name} — {d.priority}, health {d.health}</option>))}
      </select>
    </label>
  );
}
