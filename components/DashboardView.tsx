'use client';

import React from 'react';
import { 
  ArrowUpRight, 
  Plus, 
  Truck, 
  CreditCard,
  TrendingUp,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { Deal } from '@/lib/types';

interface DashboardViewProps {
  onNavigateToDeals: () => void;
  onNavigateToLedgers: () => void;
}

export function DashboardView({ onNavigateToDeals, onNavigateToLedgers }: DashboardViewProps) {
  const { deals, payments, setDealModalOpen, setPaymentModalOpen, setPrintModalOpen } = useAppStore();

  // Financial & Trading Metrics
  const totalNetProfitAllTime = deals.reduce((sum, d) => sum + (d.netProfit || 0), 0);
  const totalRevenue = deals.reduce((sum, d) => sum + (d.sellingPrice || 0), 0);
  const overallMarginPct = totalRevenue > 0 ? (totalNetProfitAllTime / totalRevenue) * 100 : 0;

  const totalClientReceivable = deals.reduce((sum, d) => {
    const due = Math.max(0, d.sellingPrice - (d.clientPaidAmount || 0));
    return sum + due;
  }, 0);
  const unpaidClientDealsCount = deals.filter(d => (d.sellingPrice - (d.clientPaidAmount || 0)) > 0).length;

  const totalVendorPayable = deals.reduce((sum, d) => {
    const due = Math.max(0, d.totalBuyingCost - (d.vendorPaidAmount || 0));
    return sum + due;
  }, 0);
  const pendingVendorCount = deals.filter(d => (d.totalBuyingCost - (d.vendorPaidAmount || 0)) > 0).length;

  const totalCollectedFromClients = payments
    .filter(p => p.partyType === 'Client')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaidToVendors = payments
    .filter(p => p.partyType === 'Vendor')
    .reduce((sum, p) => sum + p.amount, 0);

  const netCashCollected = totalCollectedFromClients - totalPaidToVendors;

  // Fulfillment rate calculation
  const deliveredCount = deals.filter(d => d.deliveryStatus === 'Delivered').length;
  const fulfillmentPct = deals.length > 0 ? Math.round((deliveredCount / deals.length) * 100) : 0;

  // Priority Deal for the featured dispatch card
  const priorityDeal: Deal | undefined = deals.find(d => d.deliveryStatus === 'Pending') || deals[0];

  // Real Weekly Capsule Bar data dynamically calculated from live deals
  const daysInfo = [
    { label: 'M', dayIndex: 1 }, // Mon
    { label: 'T', dayIndex: 2 }, // Tue
    { label: 'W', dayIndex: 3 }, // Wed
    { label: 'T', dayIndex: 4 }, // Thu
    { label: 'F', dayIndex: 5 }, // Fri
    { label: 'S', dayIndex: 6 }, // Sat
    { label: 'S', dayIndex: 0 }, // Sun
  ];

  const dailyTurnovers = daysInfo.map(d => {
    const total = deals
      .filter(deal => {
        if (!deal.date) return false;
        const dealDay = new Date(deal.date).getDay();
        return dealDay === d.dayIndex;
      })
      .reduce((sum, deal) => sum + (deal.sellingPrice || 0), 0);
    return { day: d.label, total };
  });

  const maxDaily = Math.max(...dailyTurnovers.map(d => d.total), 0);

  const capsuleData = dailyTurnovers.map(item => {
    let heightClass = 'h-6';
    if (maxDaily > 0 && item.total > 0) {
      const ratio = item.total / maxDaily;
      if (ratio > 0.8) heightClass = 'h-28';
      else if (ratio > 0.6) heightClass = 'h-24';
      else if (ratio > 0.4) heightClass = 'h-20';
      else if (ratio > 0.2) heightClass = 'h-14';
      else heightClass = 'h-10';
    }
    return {
      day: item.day,
      height: heightClass,
      value: formatCurrency(item.total),
      hasValue: item.total > 0,
    };
  });

  // Derive party summary rows dynamically from live deals
  const uniqueClients = Array.from(new Set(deals.map(d => d.clientName))).filter(Boolean);
  const partyRows = uniqueClients.slice(0, 4).map(clientName => {
    const clientDeals = deals.filter(d => d.clientName === clientName);
    const totalBilled = clientDeals.reduce((s, d) => s + d.sellingPrice, 0);
    const totalPaid = clientDeals.reduce((s, d) => s + (d.clientPaidAmount || 0), 0);
    const balanceDue = Math.max(0, totalBilled - totalPaid);
    const status = balanceDue === 0 ? 'Settled' : totalPaid > 0 ? 'Partial' : 'Unpaid';
    const statusClass = balanceDue === 0
      ? 'border border-[#5345E6]/30 text-[#5345E6] bg-[#5345E6]/5'
      : totalPaid > 0
      ? 'border border-amber-300 text-amber-600 bg-amber-50'
      : 'border border-rose-300 text-rose-600 bg-rose-50';

    return {
      name: clientName,
      role: `${clientDeals.length} deal${clientDeals.length > 1 ? 's' : ''} • ${clientDeals[0]?.itemDescription || ''}`,
      due: balanceDue > 0 ? `${formatCurrency(balanceDue)} due` : 'Settled',
      status,
      statusClass,
      avatarBg: 'bg-indigo-100 text-indigo-700',
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Header Row: Dashboard Title & Dual Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Trading Command Center
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Real-time view of your supply deals, receivables, payables, and net trading margins.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Primary + Add Supply Deal Button */}
          <button
            onClick={() => setDealModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#5345E6] hover:bg-[#4335D6] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#5345E6]/25 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Add Supply Deal</span>
          </button>

          {/* Secondary Record Payment Button */}
          <button
            onClick={() => setPaymentModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-slate-500" />
            <span>+ Record Payment</span>
          </button>
        </div>
      </div>

      {/* 4 Big Summary KPI Cards Grid matching the Reference Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Vibrant Royal Purple Accent Card (Total Net Profit) */}
        <div className="bg-[#5345E6] rounded-2xl p-5 text-white shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/90">
              Total Net Profit
            </span>
            <button 
              onClick={onNavigateToDeals}
              title="View Deals Tracker"
              className="w-7 h-7 rounded-full bg-white text-[#5345E6] flex items-center justify-center hover:scale-110 transition-transform shadow-xs cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          <div className="my-3">
            <div className="text-3xl font-black tracking-tight text-white tabular-nums">
              {formatCurrency(totalNetProfitAllTime)}
            </div>
            <div className="text-[11px] font-bold text-white/80 mt-0.5">
              Net Margin: {overallMarginPct.toFixed(1)}% of Revenue
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-white/20 text-white text-[10px] font-semibold px-2 py-1 rounded-lg w-fit backdrop-blur-xs">
            <TrendingUp className="w-3 h-3" />
            <span>{deals.length > 0 ? `${deals.length} active order${deals.length > 1 ? 's' : ''}` : 'Fresh start • 0 orders'}</span>
          </div>
        </div>

        {/* Card 2: Client Receivables (Money I Will Get) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Client Receivables
            </span>
            <button 
              onClick={onNavigateToLedgers}
              title="View Client Ledgers"
              className="w-7 h-7 rounded-full border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 stroke-[2]" />
            </button>
          </div>

          <div className="my-3">
            <div className="text-3xl font-black tracking-tight text-emerald-600 tabular-nums">
              {formatCurrency(totalClientReceivable)}
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-0.5">
              Pending from {unpaidClientDealsCount} client orders
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            <span>Active client dues</span>
          </div>
        </div>

        {/* Card 3: Vendor Payables (Money I Need to Pay) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Vendor Payables
            </span>
            <button 
              onClick={onNavigateToLedgers}
              title="View Vendor Ledgers"
              className="w-7 h-7 rounded-full border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 stroke-[2]" />
            </button>
          </div>

          <div className="my-3">
            <div className="text-3xl font-black tracking-tight text-rose-600 tabular-nums">
              {formatCurrency(totalVendorPayable)}
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-0.5">
              Owed to {pendingVendorCount} suppliers
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
            <AlertCircle className="w-3 h-3 text-rose-500" />
            <span>Upcoming vendor bills</span>
          </div>
        </div>

        {/* Card 4: Cash in Hand / Net Cash Flow */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Cash In Hand (Net)
            </span>
            <button 
              onClick={onNavigateToLedgers}
              title="View Cashflow"
              className="w-7 h-7 rounded-full border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 stroke-[2]" />
            </button>
          </div>

          <div className="my-3">
            <div className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">
              {formatCurrency(netCashCollected)}
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-0.5">
              Collected: {formatCurrency(totalCollectedFromClients)}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
            <PackageCheck className="w-3 h-3 text-sky-500" />
            <span>Total trade cashflow</span>
          </div>
        </div>
      </div>

      {/* Middle Row (3 Widget Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Widget 1: Weekly Trading Turnover (The Capsule Pill Bar Chart!) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                Weekly Trade Turnover
              </h3>
              <p className="text-[10px] text-slate-400">Daily supply volume & dispatch</p>
            </div>
            <span className="text-[10px] font-bold text-[#5345E6] bg-[#5345E6]/10 px-2 py-0.5 rounded-md">
              This Week
            </span>
          </div>

          {/* 7 Vertical Capsule Pill Bars with Signature White Dot */}
          <div className="flex items-end justify-between px-2 pt-6 pb-2 h-36">
            {capsuleData.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 group cursor-pointer" title={`${item.day}: ${item.value} traded`}>
                {/* Capsule Pill Bar */}
                <div className={`w-8 ${item.height} ${item.hasValue ? 'bg-[#5345E6]' : 'bg-slate-100 border border-slate-200/60'} rounded-full flex flex-col items-center pt-2 transition-transform hover:scale-105 shadow-2xs`}>
                  {/* Signature circle dot inside top of capsule */}
                  <span className={`w-2.5 h-2.5 rounded-full ${item.hasValue ? 'bg-white' : 'bg-slate-300'} shadow-2xs`}></span>
                </div>
                {/* Day label */}
                <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-800">
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 2: Priority Active Order in Transit (Delivery Gate Pass / Challan) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
          {priorityDeal ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Priority Dispatch
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    {priorityDeal.deliveryStatus}
                  </span>
                </div>

                <h2 className="text-base font-extrabold text-slate-900 leading-snug mt-1">
                  {priorityDeal.clientName}
                </h2>
                <p className="text-xs text-[#5345E6] font-bold mt-1">
                  {priorityDeal.quantity} {priorityDeal.unit} • {priorityDeal.itemDescription}
                </p>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Date: {priorityDeal.date}
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setPrintModalOpen(true, priorityDeal)}
                  className="w-full py-2.5 px-4 bg-[#5345E6] hover:bg-[#4335D6] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#5345E6]/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Truck className="w-4 h-4 fill-white" />
                  <span>Print Delivery Challan (Gate Pass)</span>
                </button>
              </div>
            </>
          ) : (
            <div className="py-6 text-center space-y-3 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-[#5345E6]/10 text-[#5345E6] flex items-center justify-center mx-auto">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">No Orders in Transit</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Log a supply deal to track goods dispatch, delivery status, and print gate passes.
                </p>
              </div>
              <button
                onClick={() => setDealModalOpen(true)}
                className="px-4 py-2 bg-[#5345E6] hover:bg-[#4335D6] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                + Add Supply Deal
              </button>
            </div>
          )}
        </div>

        {/* Widget 3: Active Deals & Sourcing Tracker */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                Active Supply Deals
              </h3>
              <p className="text-[10px] text-slate-400">Pending sourcing & deliveries</p>
            </div>
            <button 
              onClick={() => setDealModalOpen(true)}
              className="text-[11px] font-bold text-[#5345E6] hover:text-[#4335D6] border border-[#5345E6]/20 bg-[#5345E6]/5 rounded-lg px-2.5 py-1 hover:bg-[#5345E6]/10 transition-colors cursor-pointer"
            >
              + New Deal
            </button>
          </div>

          {deals.length === 0 ? (
            <div className="py-8 text-center space-y-2 my-auto">
              <PackageCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">No deals logged yet</p>
              <p className="text-[11px] text-slate-400">Click &quot;+ New Deal&quot; above to log your first order</p>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {deals.slice(0, 4).map((deal, idx) => {
                const dotColors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-600'];
                const bgColors = ['bg-blue-100', 'bg-emerald-100', 'bg-purple-100', 'bg-amber-100'];
                return (
                  <div 
                    key={deal.id} 
                    className="flex items-start gap-2.5 group cursor-pointer" 
                    onClick={onNavigateToDeals}
                  >
                    <div className={`w-4 h-4 rounded-md ${bgColors[idx % 4]} flex items-center justify-center mt-0.5`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[idx % 4]}`}></span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-[#5345E6] transition-colors leading-none truncate max-w-[200px]">
                        {deal.itemDescription}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">
                        {deal.clientName} • {deal.quantity} {deal.unit} • {formatCurrency(deal.sellingPrice)}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      deal.deliveryStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {deal.deliveryStatus}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row (3 Widget Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Widget 4: Client & Vendor Ledgers */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                Client & Vendor Ledgers
              </h3>
              <p className="text-[10px] text-slate-400">Outstanding receivables & payables</p>
            </div>
            <button 
              onClick={onNavigateToLedgers}
              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-2 py-0.5 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              View All
            </button>
          </div>

          {partyRows.length === 0 ? (
            <div className="py-8 text-center space-y-2 my-auto">
              <p className="text-xs font-semibold text-slate-600">No party ledger accounts</p>
              <p className="text-[11px] text-slate-400">Clients and vendors will appear here automatically when deals are created.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {partyRows.map((party, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between group cursor-pointer" 
                  onClick={onNavigateToLedgers}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl ${party.avatarBg} flex items-center justify-center text-xs font-bold`}>
                      {party.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#5345E6] transition-colors leading-tight truncate max-w-[150px]">
                        {party.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {party.role}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${party.statusClass}`}>
                      {party.status}
                    </span>
                    <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                      {party.due}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Widget 5: Deal Fulfillment & Settlement Progress Gauge */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                Fulfillment & Settlement
              </h3>
              <p className="text-[10px] text-slate-400">Delivery completion rate</p>
            </div>
          </div>

          {/* Semi-Circle SVG Progress Gauge matching Reference */}
          <div className="flex flex-col items-center justify-center my-2">
            <div className="relative w-48 h-24 overflow-hidden flex items-end justify-center">
              {/* Semi-Circle background track */}
              <svg viewBox="0 0 100 50" className="w-48 h-24">
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="#EEEDFD"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                {/* Foreground active arc (calculated dynamically) */}
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="#5345E6"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray="125.6"
                  strokeDashoffset={125.6 - (125.6 * fulfillmentPct) / 100}
                />
              </svg>
              {/* Center percentage value */}
              <div className="absolute bottom-0 text-center">
                <div className="text-2xl font-black text-slate-900 tracking-tight leading-none tabular-nums">
                  {fulfillmentPct}%
                </div>
                <div className="text-[10px] font-medium text-slate-400 mt-0.5">
                  Deals Fulfilled
                </div>
              </div>
            </div>

            {/* Legend below gauge matching Reference */}
            <div className="flex items-center justify-center gap-4 mt-4 text-[10px] font-semibold text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5345E6]"></span>
                <span>Delivered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                <span>In Transit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#B9B5FD]"></span>
                <span>Pending</span>
              </div>
            </div>
          </div>
        </div>

        {/* Widget 6: Live Cash Position & Fast Remittance */}
        <div className="lg:col-span-4 bg-[#0B0D19] rounded-2xl p-5 border border-slate-800 shadow-md text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle glowing ambient light */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#5345E6]/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-bold text-white">
              Live Cash Position
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              netCashCollected >= 0 
                ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-800/80' 
                : 'text-rose-400 bg-rose-950/80 border border-rose-800/80'
            }`}>
              {netCashCollected >= 0 ? 'Net Positive' : 'Negative'}
            </span>
          </div>

          <div className="relative z-10 text-center my-3">
            {/* Digital Cashflow Display */}
            <div className="text-2xl sm:text-3xl font-mono font-black tracking-wider text-sky-400 tabular-nums">
              {formatCurrency(netCashCollected)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-medium">
              In: {formatCurrency(totalCollectedFromClients)} • Out: {formatCurrency(totalPaidToVendors)}
            </div>
          </div>

          {/* Interactive Quick Remittance Action Buttons */}
          <div className="relative z-10 flex items-center justify-center gap-3 pt-1">
            <button
              onClick={() => setPaymentModalOpen(true, { name: '', type: 'Client' })}
              title="Record Money Received from Client"
              className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-transform hover:scale-102 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record In</span>
            </button>

            <button
              onClick={() => setPaymentModalOpen(true, { name: '', type: 'Vendor' })}
              title="Record Vendor Payout"
              className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-transform hover:scale-102 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
