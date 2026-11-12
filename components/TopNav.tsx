'use client';

import React, { useState, useRef } from 'react';
import { 
  Search, 
  Mail, 
  Bell, 
  ChevronDown, 
  Download, 
  RotateCcw, 
  FileSpreadsheet,
  Upload,
  Menu,
  Cloud,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { exportDealsToCSV } from '@/lib/export-csv';

interface TopNavProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenMobileSidebar?: () => void;
}

export function TopNav({ searchQuery, onSearchChange, onOpenMobileSidebar }: TopNavProps) {
  const { 
    deals, 
    exportBackupJSON, 
    importBackupJSON, 
    resetToDemoData,
    cloudSyncStatus,
    syncWithSupabase
  } = useAppStore();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    const json = exportBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coursie-trader-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setProfileDropdownOpen(false);
  };

  const handleExportCSV = () => {
    exportDealsToCSV(deals);
    setProfileDropdownOpen(false);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importBackupJSON(content);
        if (success) {
          alert('Backup restored successfully!');
        } else {
          alert('Failed to parse backup file. Please check format.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setProfileDropdownOpen(false);
  };

  return (
    <header className="h-20 px-4 sm:px-8 flex items-center justify-between no-print gap-4">
      {/* Search Input Container - Clean rounded pill with shadow */}
      <div className="flex items-center gap-2.5 w-full max-w-md">
        {onOpenMobileSidebar && (
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2.5 rounded-2xl bg-white border border-slate-100 text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer shrink-0"
            title="Open Navigation Menu"
          >
            <Menu className="w-4 h-4 text-slate-700" />
          </button>
        )}
        <div className="relative flex items-center flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search deals, clients, vendors, goods..."
            className="w-full bg-white text-slate-800 text-sm font-medium pl-10 pr-4 py-2.5 rounded-2xl shadow-xs border border-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#5345E6]/20 transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Cloud Status, Mail, Notification Bell, User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Supabase Cloud Sync Status Pill - Always Auto Connected */}
        <button
          onClick={() => syncWithSupabase()}
          title="Supabase Cloud Connected Always (Click to refresh sync)"
          className="h-10 px-3 rounded-2xl border shadow-xs flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100"
        >
          {cloudSyncStatus === 'syncing' ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
          ) : (
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
          )}
          <span className="hidden md:inline">
            {cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Cloud Synced'}
          </span>
        </button>

        {/* Mail Button */}
        <button 
          title="Inquiries & Messages"
          onClick={() => alert('No unread trade inquiries.')}
          className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-center text-slate-600 hover:text-slate-900 hover:shadow-sm transition-all cursor-pointer"
        >
          <Mail className="w-4 h-4 text-slate-500" />
        </button>

        {/* Bell Button */}
        <button 
          title="Trade Alerts"
          onClick={() => {
            const pending = deals.filter(d => (d.sellingPrice - (d.clientPaidAmount || 0)) > 0).length;
            alert(pending > 0 ? `${pending} client orders currently have pending receivables.` : 'All client accounts are clear! Zero overdue receivables.');
          }}
          className="relative w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-center text-slate-600 hover:text-slate-900 hover:shadow-sm transition-all cursor-pointer"
        >
          <Bell className="w-4 h-4 text-slate-500" />
          {deals.filter(d => (d.sellingPrice - (d.clientPaidAmount || 0)) > 0).length > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
          )}
        </button>

        {/* Profile Card */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-2xl hover:bg-white/80 transition-all cursor-pointer select-none"
          >
            {/* Illustrated avatar badge */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5345E6] to-[#8B80F9] flex items-center justify-center text-white font-bold text-sm shadow-xs overflow-hidden">
              <span className="text-sm">TH</span>
            </div>

            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                My Trading Business
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                Single Owner Account
              </div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {/* Profile Dropdown */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900">My Trading Business</p>
                <p className="text-[10px] text-slate-400">Single Owner Account</p>
              </div>

              <button
                onClick={handleExportJSON}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#5345E6]" />
                <span>Export JSON Backup</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Deals (CSV)</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-sky-600" />
                <span>Import JSON Backup</span>
              </button>

              <div className="my-1 border-t border-slate-100"></div>

              <button
                onClick={() => {
                  if (confirm('Clear all data to start completely fresh?')) {
                    resetToDemoData();
                    alert('All data cleared. Fresh start ready.');
                  }
                  setProfileDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear All Live Data</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

