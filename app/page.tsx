'use client';

import dynamic from 'next/dynamic';

const TradingApp = dynamic(() => import('@/components/TradingApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#F4F5F9] flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#5345E6] flex items-center justify-center text-white font-black text-lg animate-pulse shadow-md shadow-[#5345E6]/30">
          t
        </div>
        <p className="text-xs font-bold text-slate-400">Loading TraderHub...</p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  return <TradingApp />;
}
