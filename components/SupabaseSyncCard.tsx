'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Key, 
  ExternalLink, 
  Copy, 
  Check, 
  UploadCloud,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getSupabaseCredentials, testSupabaseConnection } from '@/lib/supabase';

export function SupabaseSyncCard() {
  const { 
    cloudSyncStatus, 
    lastSyncedAt, 
    syncWithSupabase, 
    pushAllToSupabase,
    deals,
    savedParties,
    payments
  } = useAppStore();

  const [url, setUrl] = useState(() => getSupabaseCredentials().url);
  const [anonKey, setAnonKey] = useState(() => getSupabaseCredentials().anonKey);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    syncWithSupabase();
  }, [syncWithSupabase]);

  const handleSaveAndConnect = async () => {
    if (!anonKey.trim()) {
      setMessage({ text: 'Please enter your Supabase anon public API key.', isError: true });
      return;
    }

    setTesting(true);
    setMessage(null);

    localStorage.setItem('traderhub_supabase_url', url.trim());
    localStorage.setItem('traderhub_supabase_key', anonKey.trim());

    const result = await testSupabaseConnection(url.trim(), anonKey.trim());
    setTesting(false);

    if (result.success) {
      setMessage({ text: result.message, isError: false });
      await syncWithSupabase();
    } else {
      setMessage({ text: `Connection error: ${result.message}`, isError: true });
    }
  };

  const handleCopySchema = () => {
    const sql = `-- TraderHub B2B Platform - Supabase PostgreSQL Database Schema
CREATE TABLE IF NOT EXISTS public.saved_parties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  party_type TEXT NOT NULL CHECK (party_type IN ('Client', 'Vendor')),
  phone TEXT,
  contact_person TEXT,
  address TEXT,
  payment_terms TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deals (
  id TEXT PRIMARY KEY,
  deal_number TEXT NOT NULL,
  date TEXT NOT NULL,
  client_name TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  item_description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'ton',
  vendor_rate NUMERIC NOT NULL DEFAULT 0,
  transport_cost NUMERIC NOT NULL DEFAULT 0,
  total_buying_cost NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  net_profit NUMERIC NOT NULL DEFAULT 0,
  profit_margin_pct NUMERIC NOT NULL DEFAULT 0,
  delivery_status TEXT NOT NULL DEFAULT 'Pending' CHECK (delivery_status IN ('Pending', 'Delivered')),
  payment_status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Partial', 'Settled')),
  client_paid_amount NUMERIC NOT NULL DEFAULT 0,
  vendor_paid_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  party_type TEXT NOT NULL CHECK (party_type IN ('Client', 'Vendor')),
  party_name TEXT NOT NULL,
  deal_id TEXT,
  deal_number TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'Bank' CHECK (payment_method IN ('Bank', 'Cash', 'bKash', 'Nagad')),
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.saved_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access on saved_parties" ON public.saved_parties FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on deals" ON public.deals FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on payments" ON public.payments FOR ALL TO public USING (true) WITH CHECK (true);
`;
    navigator.clipboard.writeText(sql);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Supabase Cloud Backend</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Always Auto-Connected</span>
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Permanently connected to project <code className="text-[11px] font-mono text-[#5345E6] bg-[#5345E6]/5 px-1 rounded">xzxwifdyixxfjlbnjrrv</code>. All orders, contacts, and receipts sync automatically.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => syncWithSupabase()}
            disabled={cloudSyncStatus === 'syncing'}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cloudSyncStatus === 'syncing' ? 'animate-spin text-[#5345E6]' : 'text-slate-400'}`} />
            <span>{cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Sync Cloud Now'}</span>
          </button>
          <button
            onClick={() => pushAllToSupabase()}
            disabled={cloudSyncStatus === 'syncing'}
            className="px-3.5 py-2 rounded-xl bg-[#5345E6] hover:bg-[#4335D6] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Local to Cloud</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Automatic background sync is active: <strong>{deals.length} deals</strong>, <strong>{savedParties.length} contacts</strong>, <strong>{payments.length} payments</strong></span>
        </div>
        <div>
          {lastSyncedAt ? (
            <span className="text-slate-400 text-[11px]">Last synced: {new Date(lastSyncedAt).toLocaleTimeString()}</span>
          ) : (
            <span className="text-emerald-600 font-bold text-[11px]">Synced with cloud</span>
          )}
        </div>
      </div>

      {/* Advanced Connection Settings Collapsible */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>{showAdvanced ? 'Hide' : 'View'} Advanced API Credentials</span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvanced && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4 animate-in fade-in duration-150">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-mono font-medium focus:outline-hidden focus:border-[#5345E6]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span>Supabase API Key</span>
                </label>
                <a
                  href="https://supabase.com/dashboard/project/xzxwifdyixxfjlbnjrrv/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-[#5345E6] hover:underline flex items-center gap-0.5"
                >
                  <span>Supabase Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-mono font-medium focus:outline-hidden focus:border-[#5345E6]"
              />
            </div>

            {message && (
              <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                message.isError ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                {message.isError ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                )}
                <div className="font-medium">{message.text}</div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopySchema}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedSchema ? 'SQL Schema Copied!' : 'Copy SQL Schema'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndConnect}
                disabled={testing}
                className="px-4 py-2 bg-[#5345E6] hover:bg-[#4335D6] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Key</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
