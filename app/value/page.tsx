import Link from "next/link";

export default function Value() {
  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center text-center">
      <svg aria-hidden viewBox="0 0 560 520" className="absolute left-1/2 top-1/2 h-[480px] w-[520px] -translate-x-1/2 -translate-y-1/2">
        <path d="M20 70 H540 L280 500 Z" fill="none" stroke="#C0C8D0" strokeWidth="4" />
        <circle cx="280" cy="70" r="42" fill="#D83038" />
      </svg>
      <div className="relative">
        <h1 className="display text-7xl text-navy sm:text-8xl">Dealer360</h1>
        <p className="display mt-1 text-4xl text-navy">Value</p>
        <p className="mt-6 text-lg font-medium text-navy">From Signal to Improvement.<br />Every Time.</p>
        <p className="mt-4 text-sm text-navy">Risk → Diagnosis → Action → Learning</p>
        <Link href="/overview" className="mt-8 inline-block rounded-sm border border-navy px-5 py-2 text-sm text-navy hover:bg-navy hover:text-white">Restart the demo</Link>
      </div>
    </div>
  );
}
