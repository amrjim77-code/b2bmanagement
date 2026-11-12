import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Deal, PaymentRecord, SavedParty } from './types';

// Hardcoded permanent project configuration for seamless auto-connection
const DEFAULT_SUPABASE_URL = 'https://xzxwifdyixxfjlbnjrrv.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_JnzTpZsMOZntqEL6cZaikQ_bvFN6Trr';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  // Check localStorage for any user custom override
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('traderhub_supabase_url');
    const savedKey = localStorage.getItem('traderhub_supabase_key');
    if (savedUrl) url = savedUrl;
    if (savedKey) anonKey = savedKey;
  }

  return { url: url.trim(), anonKey: anonKey.trim() };
}

let cachedClient: SupabaseClient | null = null;
let cachedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();

  if (!url || !anonKey) {
    return null;
  }

  if (cachedClient && cachedKey === anonKey) {
    return cachedClient;
  }

  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  cachedKey = anonKey;

  return cachedClient;
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && anonKey.length > 10);
}

// -------------------------------------------------------------
// Database Types & Mappers (CamelCase TypeScript <-> snake_case PostgreSQL)
// -------------------------------------------------------------

interface DbDealRow {
  id: string;
  deal_number: string;
  date: string;
  client_name: string;
  vendor_name: string;
  item_description: string;
  quantity: number | string;
  unit: string;
  vendor_rate: number | string;
  transport_cost: number | string;
  total_buying_cost: number | string;
  selling_price: number | string;
  net_profit: number | string;
  profit_margin_pct: number | string;
  delivery_status: 'Pending' | 'Delivered';
  payment_status: 'Unpaid' | 'Partial' | 'Settled';
  client_paid_amount?: number | string | null;
  vendor_paid_amount?: number | string | null;
  notes?: string | null;
  created_at: string;
}

interface DbPaymentRow {
  id: string;
  date: string;
  party_type: 'Client' | 'Vendor';
  party_name: string;
  deal_id?: string | null;
  deal_number?: string | null;
  amount: number | string;
  payment_method: 'Bank' | 'Cash' | 'bKash' | 'Nagad';
  reference?: string | null;
  notes?: string | null;
}

interface DbPartyRow {
  id: string;
  name: string;
  party_type: 'Client' | 'Vendor';
  phone?: string | null;
  contact_person?: string | null;
  address?: string | null;
  payment_terms?: string | null;
  notes?: string | null;
  created_at: string;
}

export function mapDealToDb(deal: Deal) {
  return {
    id: deal.id,
    deal_number: deal.dealNumber,
    date: deal.date,
    client_name: deal.clientName,
    vendor_name: deal.vendorName,
    item_description: deal.itemDescription,
    quantity: deal.quantity,
    unit: deal.unit,
    vendor_rate: deal.vendorRate,
    transport_cost: deal.transportCost,
    total_buying_cost: deal.totalBuyingCost,
    selling_price: deal.sellingPrice,
    net_profit: deal.netProfit,
    profit_margin_pct: deal.profitMarginPct,
    delivery_status: deal.deliveryStatus,
    payment_status: deal.paymentStatus,
    client_paid_amount: deal.clientPaidAmount,
    vendor_paid_amount: deal.vendorPaidAmount,
    notes: deal.notes || null,
    created_at: deal.createdAt,
  };
}

export function mapDbToDeal(row: DbDealRow): Deal {
  return {
    id: row.id,
    dealNumber: row.deal_number,
    date: row.date,
    clientName: row.client_name,
    vendorName: row.vendor_name,
    itemDescription: row.item_description,
    quantity: Number(row.quantity),
    unit: row.unit,
    vendorRate: Number(row.vendor_rate),
    transportCost: Number(row.transport_cost),
    totalBuyingCost: Number(row.total_buying_cost),
    sellingPrice: Number(row.selling_price),
    netProfit: Number(row.net_profit),
    profitMarginPct: Number(row.profit_margin_pct),
    deliveryStatus: row.delivery_status,
    paymentStatus: row.payment_status,
    clientPaidAmount: Number(row.client_paid_amount || 0),
    vendorPaidAmount: Number(row.vendor_paid_amount || 0),
    notes: row.notes || undefined,
    createdAt: row.created_at,
  };
}

export function mapPaymentToDb(payment: PaymentRecord) {
  return {
    id: payment.id,
    date: payment.date,
    party_type: payment.partyType,
    party_name: payment.partyName,
    deal_id: payment.dealId || null,
    deal_number: payment.dealNumber || null,
    amount: payment.amount,
    payment_method: payment.paymentMethod,
    reference: payment.reference || null,
    notes: payment.notes || null,
  };
}

export function mapDbToPayment(row: DbPaymentRow): PaymentRecord {
  return {
    id: row.id,
    date: row.date,
    partyType: row.party_type,
    partyName: row.party_name,
    dealId: row.deal_id || undefined,
    dealNumber: row.deal_number || undefined,
    amount: Number(row.amount),
    paymentMethod: row.payment_method,
    reference: row.reference || undefined,
    notes: row.notes || undefined,
  };
}

export function mapPartyToDb(party: SavedParty) {
  return {
    id: party.id,
    name: party.name,
    party_type: party.partyType,
    phone: party.phone || null,
    contact_person: party.contactPerson || null,
    address: party.address || null,
    payment_terms: party.paymentTerms || null,
    notes: party.notes || null,
    created_at: party.createdAt,
  };
}

export function mapDbToParty(row: DbPartyRow): SavedParty {
  return {
    id: row.id,
    name: row.name,
    partyType: row.party_type,
    phone: row.phone || undefined,
    contactPerson: row.contact_person || undefined,
    address: row.address || undefined,
    paymentTerms: row.payment_terms || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
  };
}

// -------------------------------------------------------------
// Cloud Sync Services
// -------------------------------------------------------------

export async function fetchAllFromSupabase(): Promise<{
  deals: Deal[];
  payments: PaymentRecord[];
  savedParties: SavedParty[];
} | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const [dealsRes, paymentsRes, partiesRes] = await Promise.all([
      supabase.from('deals').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('date', { ascending: false }),
      supabase.from('saved_parties').select('*').order('created_at', { ascending: false }),
    ]);

    if (dealsRes.error || paymentsRes.error || partiesRes.error) {
      console.warn('Supabase fetch error:', dealsRes.error || paymentsRes.error || partiesRes.error);
      return null;
    }

    return {
      deals: (dealsRes.data || []).map(mapDbToDeal),
      payments: (paymentsRes.data || []).map(mapDbToPayment),
      savedParties: (partiesRes.data || []).map(mapDbToParty),
    };
  } catch (err) {
    console.error('Failed to fetch from Supabase:', err);
    return null;
  }
}

export async function syncDealToSupabase(deal: Deal) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('deals').upsert(mapDealToDb(deal));
  } catch (e) {
    console.error('Error syncing deal to Supabase:', e);
  }
}

export async function deleteDealFromSupabase(dealId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('deals').delete().eq('id', dealId);
  } catch (e) {
    console.error('Error deleting deal from Supabase:', e);
  }
}

export async function syncPaymentToSupabase(payment: PaymentRecord) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('payments').upsert(mapPaymentToDb(payment));
  } catch (e) {
    console.error('Error syncing payment to Supabase:', e);
  }
}

export async function deletePaymentFromSupabase(paymentId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('payments').delete().eq('id', paymentId);
  } catch (e) {
    console.error('Error deleting payment from Supabase:', e);
  }
}

export async function syncPartyToSupabase(party: SavedParty) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('saved_parties').upsert(mapPartyToDb(party));
  } catch (e) {
    console.error('Error syncing party to Supabase:', e);
  }
}

export async function deletePartyFromSupabase(partyId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('saved_parties').delete().eq('id', partyId);
  } catch (e) {
    console.error('Error deleting party from Supabase:', e);
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const testClient = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await testClient.from('deals').select('id').limit(1);

    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('relation "public.deals" does not exist')) {
        return {
          success: true,
          message: 'Connected to Supabase! However, the database tables have not been created yet. Please run the schema.sql script in your Supabase SQL Editor.',
        };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Connected successfully to Supabase! Cloud sync is active.' };
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : 'Connection failed';
    return { success: false, message: errorMsg };
  }
}
