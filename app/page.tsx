import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Cover() {
  return (
    <div className="relative flex min-h-[78vh] flex-col items-center justify-center overflow-hidden text-center">
      <svg aria-hidden viewBox="0 0 560 520" className="absolute left-1/2 top-1/2 h-[520px] w-[560px] -translate-x-1/2 -translate-y-1/2 opacity-90">
        <path d="M20 70 H540 L280 500 Z" fill="none" stroke="#C0C8D0" strokeWidth="4" />
        <circle cx="280" cy="70" r="46" fill="#D83038" />
      </svg>
      <div aria-hidden className="absolute left-1/2 top-0 h-24 w-px bg-steel" />
      <div aria-hidden className="absolute left-1/2 top-24 h-4 w-4 -translate-x-1/2 rounded-full bg-alert" />
      <div className="relative">
        <h1 className="display text-7xl text-navy sm:text-8xl xl:text-[9rem] xl:leading-[0.95]">Dealer360</h1>
        <p className="display mt-2 text-3xl text-navy sm:text-4xl">Platform</p>
        <p className="mt-6 text-base font-medium text-navy">Enterprise Dealer Performance Platform</p>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-snug text-navy/80">From Risk Detection to Measurable Improvement</p>
        <Link href="/overview" className="group mt-10 inline-flex items-center gap-2 rounded-sm bg-navy px-6 py-3 text-sm text-white transition-colors hover:bg-ink">
          Open Network Health Overview <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div aria-hidden className="absolute bottom-14 right-[22%] h-8 w-56 bg-alert" />
    </div>
  );
}
