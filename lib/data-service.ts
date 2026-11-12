import { Deal, PaymentRecord } from './types';

/**
 * Data Service Abstraction Layer
 * Default: Browser LocalStorage via Zustand
 * To swap with Firebase or Supabase later, simply replace the implementations below.
 */

export interface IDataService {
  getDeals: () => Promise<Deal[]>;
  saveDeal: (deal: Deal) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
  getPayments: () => Promise<PaymentRecord[]>;
  savePayment: (payment: PaymentRecord) => Promise<void>;
}

// Local Storage Service implementation
export const localDataService: IDataService = {
  async getDeals() {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('trader_deals');
    return saved ? JSON.parse(saved) : [];
  },
  async saveDeal(deal: Deal) {
    if (typeof window === 'undefined') return;
    const deals = await this.getDeals();
    const idx = deals.findIndex(d => d.id === deal.id);
    if (idx >= 0) deals[idx] = deal;
    else deals.unshift(deal);
    localStorage.setItem('trader_deals', JSON.stringify(deals));
  },
  async deleteDeal(id: string) {
    if (typeof window === 'undefined') return;
    const deals = await this.getDeals();
    const filtered = deals.filter(d => d.id !== id);
    localStorage.setItem('trader_deals', JSON.stringify(filtered));
  },
  async getPayments() {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('trader_payments');
    return saved ? JSON.parse(saved) : [];
  },
  async savePayment(payment: PaymentRecord) {
    if (typeof window === 'undefined') return;
    const payments = await this.getPayments();
    payments.unshift(payment);
    localStorage.setItem('trader_payments', JSON.stringify(payments));
  }
};

/**
 * Cloud Sync Stub (Supabase / Firebase Plug-and-Play)
 * Uncomment & add credentials when you are ready to enable cloud sync:
 *
 * export const cloudDataService: IDataService = {
 *   async getDeals() {
 *     const { data } = await supabase.from('deals').select('*');
 *     return data || [];
 *   },
 *   // ...
 * };
 */

export const currentDataService: IDataService = localDataService;

