'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Calendar, 
  BarChart3, 
  Users, 
  Settings, 
  HelpCircle, 
  LogOut,
  Download, 
  Sparkles,
  X 
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

export type NavView = 'dashboard' | 'deals' | 'calendar' | 'analytics' | 'team' | 'settings';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ currentView, onSelectView, isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const { deals, savedParties, exportBackupJSON, resetToDemoData } = useAppStore();

  const handleExportJSON = () => {
    const json = exportBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `traderhub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const navItems = [
    { id: 'dashboard' as NavView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'deals' as NavView, label: 'Supply Deals', badge: `${deals.length}`, icon: ShoppingBag },
    { id: 'team' as NavView, label: 'Clients & Vendors', badge: `${savedParties.length}`, icon: Users },
    { id: 'calendar' as NavView, label: 'Delivery Schedule', icon: Calendar },
    { id: 'analytics' as NavView, label: 'Profit & Margins', icon: BarChart3 },
  ];

  const generalItems = [
    { id: 'settings' as NavView, label: 'Settings & Letterhead', icon: Settings },
    { id: 'help', label: 'Help & Guide', icon: HelpCircle, action: () => alert('TraderHub Bangladesh: Track your supply orders, compute net profit (Client Bill - Supplier Rate - Truck Fare), monitor client dues, and print Delivery Challans in BDT (৳).') },
    { id: 'logout', label: 'Clear Live Data', icon: LogOut, action: () => {
      if (confirm('Are you sure you want to clear all deals and payment records?')) resetToDemoData();
    }},
  ];

  const handleItemClick = (id: NavView) => {
    onSelectView(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Element */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 min-w-[16rem] bg-white border-r border-slate-100 flex flex-col justify-between p-6 select-none no-print transition-transform duration-200 ease-in-out
        lg:static lg:translate-x-0
        ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="space-y-7">
          {/* Logo matching the sleek lowercase brand styling */}
          <div className="flex items-center justify-between px-2">
            <div 
              className="flex items-center gap-2.5 cursor-pointer" 
              onClick={() => handleItemClick('dashboard')}
            >
              <div className="relative flex items-center justify-center">
                <div className="w-8 h-8 rounded-xl bg-[#5345E6] flex items-center justify-center text-white font-black text-base shadow-sm shadow-[#5345E6]/30">
                  <span className="tracking-tighter">t</span>
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white"></span>
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">
                trader<span className="text-[#5345E6]">hub.</span>
              </span>
            </div>

            {/* Mobile Close Button */}
            {onCloseMobile && (
              <button 
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* MENU Section */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              TRADING MENU
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative group cursor-pointer ${
                      isActive
                        ? 'text-slate-900 font-bold bg-slate-50/80'
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Left purple indicator bar for active item */}
                    {isActive && (
                      <span className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#5345E6] rounded-r-md"></span>
                    )}
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#5345E6]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-[#5345E6]/10 text-[#5345E6]' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* GENERAL Section */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              DATA & SETTINGS
            </div>
            <nav className="space-y-1">
              {generalItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.action) item.action();
                      else handleItemClick(item.id as NavView);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-50/50 transition-all cursor-pointer"
                  >
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sleek Dark Bottom Card: "Backup & Export Data" */}
        <div className="mt-6">
          <div className="relative rounded-2xl p-4 bg-[#0B0D19] text-white overflow-hidden shadow-lg border border-slate-800">
            {/* Subtle gradient glow decoration */}
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#5345E6]/30 rounded-full blur-2xl"></div>

            <div className="relative z-10 space-y-3">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white backdrop-blur-xs">
                <Sparkles className="w-4 h-4 text-[#8B80F9]" />
              </div>

              <div>
                <h4 className="text-xs font-bold text-white tracking-tight">
                  Backup Trading<br />Data (JSON/CSV)
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Saved locally in browser
                </p>
              </div>

              <button
                onClick={handleExportJSON}
                className="w-full py-2 px-3 bg-[#5345E6] hover:bg-[#4335D6] text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-[#5345E6]/40 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Backup</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
