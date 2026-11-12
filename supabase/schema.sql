-- ================================================================
-- TraderHub B2B Platform - Supabase PostgreSQL Database Schema
-- Run this script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ================================================================

-- 1. SAVED PARTIES TABLE (Clients & Suppliers Directory)
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

-- 2. DEALS TABLE (Supply Orders & Trading Lifecycle)
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

-- 3. PAYMENTS TABLE (Client Receipts & Vendor Payouts)
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

-- ================================================================
-- ENABLE ROW LEVEL SECURITY & PUBLIC PERMISSIVE POLICIES
-- Allows your web app (via anon key) to read, insert, update, delete
-- ================================================================

ALTER TABLE public.saved_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policies for saved_parties
CREATE POLICY "Allow public all access on saved_parties"
  ON public.saved_parties FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Policies for deals
CREATE POLICY "Allow public all access on deals"
  ON public.deals FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Policies for payments
CREATE POLICY "Allow public all access on payments"
  ON public.payments FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_deals_client ON public.deals(client_name);
CREATE INDEX IF NOT EXISTS idx_deals_vendor ON public.deals(vendor_name);
CREATE INDEX IF NOT EXISTS idx_payments_party ON public.payments(party_name);
CREATE INDEX IF NOT EXISTS idx_payments_deal ON public.payments(deal_id);

