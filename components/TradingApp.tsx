'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  FileText, 
  RotateCcw, 
  Download 
} from 'lucide-react';
import { Sidebar, NavView } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { DashboardView } from '@/components/DashboardView';
import { DealsTable } from '@/components/DealsTable';
import { PartyLedgers } from '@/components/PartyLedgers';
import { DealModal } from '@/components/modals/DealModal';
import { PaymentModal } from '@/components/modals/PaymentModal';
import { PrintModal } from '@/components/modals/PrintModal';
import { PartyModal } from '@/components/modals/PartyModal';
import { SupabaseSyncCard } from '@/components/SupabaseSyncCard';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportDealsToCSV } from '@/lib/export-csv';

export function TradingApp() {
  const [activeView, setActiveView] = useState<NavView>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { deals, exportBackupJSON, resetToDemoData, setDealModalOpen, setPrintModalOpen, syncWithSupabase } = useAppStore();

  // Auto-connect to Supabase on mount - always kept in sync
  React.useEffect(() => {
    syncWithSupabase();
  }, [syncWithSupabase]);

  return (
    <div className="min-h-screen bg-[#F4F5F9] flex font-sans antialiased text-slate-900 selection:bg-[#5345E6]/20 selection:text-[#5345E6]">
      {/* Fixed Left Sidebar matching image */}
      <Sidebar 
        currentView={activeView} 
        onSelectView={(v) => {
          setActiveView(v);
          setIsMobileSidebarOpen(false);
        }}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar matching image (Search pill + icons + avatar) */}
        <TopNav 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 px-4 sm:px-8 pb-10 max-w-7xl w-full">
          {activeView === 'dashboard' && (
            <DashboardView 
              onNavigateToDeals={() => setActiveView('deals')}
              onNavigateToLedgers={() => setActiveView('team')}
            />
          )}

          {activeView === 'deals' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Supply Deals & Orders Tracker
                  </h1>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Log deals, auto-calculate net profit margins, update delivery transit, and generate printable invoices & challans.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDealModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-[#5345E6] hover:bg-[#4335D6] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#5345E6]/25 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Deal</span>
                  </button>
                </div>
              </div>

              <DealsTable initialSearch={searchQuery} />
            </div>
          )}

          {activeView === 'team' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Client & Vendor Party Ledgers
                  </h1>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Dual ledger system: track client receivable dues, vendor payables, and record full or partial payments.
                  </p>
                </div>
              </div>

              <PartyLedgers />
            </div>
          )}

          {activeView === 'calendar' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Delivery Dispatch Schedule
                  </h1>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Upcoming supply orders, dispatch deadlines, and fulfillment gate passes.
                  </p>
                </div>
              </div>

              {deals.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-xs space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#5345E6]/10 text-[#5345E6] flex items-center justify-center mx-auto">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">No Scheduled Deliveries</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      When you log supply deals, their dispatch dates, delivery windows, and Challan gate passes will show up here.
                    </p>
                  </div>
                  <button
                    onClick={() => setDealModalOpen(true)}
                    className="px-4 py-2 bg-[#5345E6] hover:bg-[#4335D6] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Supply Deal</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deals.map(deal => (
                    <div key={deal.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                            {deal.dealNumber}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            deal.deliveryStatus === 'Delivered' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-[#5345E6]/10 text-[#5345E6] border border-[#5345E6]/20'
                          }`}>
                            {deal.deliveryStatus}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 mb-1">
                          {deal.clientName}
                        </h3>
                        <p className="text-xs text-slate-500 mb-2">
                          {deal.quantity} {deal.unit} • {deal.itemDescription}
                        </p>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-2">
                          <CalendarIcon className="w-3.5 h-3.5 text-[#5345E6]" />
                          <span>Dispatch Date: {formatDate(deal.date)}</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {formatCurrency(deal.sellingPrice)}
                        </span>
                        <button
                          onClick={() => setPrintModalOpen(true, deal)}
                          className="text-xs font-bold text-[#5345E6] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Print Challan</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeView === 'analytics' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Profit & Margin Analytics
                  </h1>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Deep dive into trading profitability, landed costs, and collection efficiency.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
                  <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider mb-2">
                    Total Invoiced Sales
                  </span>
                  <div className="text-2xl font-black text-slate-900">
                    {formatCurrency(deals.reduce((s, d) => s + d.sellingPrice, 0))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Across {deals.length} active client orders
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
                  <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider mb-2">
                    Total Procurement + Freight
                  </span>
                  <div className="text-2xl font-black text-slate-900">
                    {formatCurrency(deals.reduce((s, d) => s + d.totalBuyingCost, 0))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Vendor rates + direct site transport costs
                  </p>
                </div>

                <div className="bg-[#5345E6] rounded-2xl p-5 text-white shadow-sm">
                  <span className="text-xs font-semibold text-white/80 block uppercase tracking-wider mb-2">
                    Cumulative Net Profit
                  </span>
                  <div className="text-2xl font-black text-white">
                    {formatCurrency(deals.reduce((s, d) => s + d.netProfit, 0))}
                  </div>
                  <p className="text-xs text-white/70 mt-2">
                    Average Margin: {(deals.reduce((s, d) => s + d.profitMarginPct, 0) / (deals.length || 1)).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Deal Breakdown List */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
                <h3 className="text-sm font-extrabold text-slate-900 mb-4">
                  Individual Deal Margin Ranking
                </h3>
                {deals.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No deals recorded yet. Add your first trade to see margin rankings.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {deals.map(deal => (
                      <div key={deal.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs font-mono">{deal.dealNumber}</span>
                            <span className="text-xs font-bold text-slate-800">{deal.clientName}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">{deal.itemDescription}</span>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-black text-emerald-600">
                            +{formatCurrency(deal.netProfit)}
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">
                            {deal.profitMarginPct.toFixed(1)}% margin
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-200 max-w-3xl">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Business Letterhead & Data Settings
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Manage your business letterhead details, data backups, and demo preferences.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Letterhead / Trading Identity</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Company / Trading Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Acme Trading & Supply Co." 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Contact Phone</label>
                    <input 
                      type="text" 
                      placeholder="e.g. +880 17XX-XXXXXX" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">Office / Depot Address</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Motijheel C/A, Dhaka-1000, Bangladesh" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Supabase Cloud Backend Sync */}
              <SupabaseSyncCard />

              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Backup & Storage Management (BDT)</h3>
                <p className="text-xs text-slate-500">
                  Your data is saved in your browser&apos;s local storage and synced automatically with Supabase. Download regular backups to safeguard your trading records.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      const json = exportBackupJSON();
                      const blob = new Blob([json], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `traderhub-bdt-backup-${new Date().toISOString().slice(0, 10)}.json`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#5345E6] hover:bg-[#4335D6] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON Backup</span>
                  </button>

                  <button
                    onClick={() => exportDealsToCSV(deals)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV Spreadsheet</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to clear all deals and start completely fresh?')) {
                        resetToDemoData();
                        alert('All trading records cleared. Clean slate ready.');
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear All Live Data</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals Container */}
      <DealModal />
      <PaymentModal />
      <PrintModal />
      <PartyModal />
    </div>
  );
}
export default TradingApp;

