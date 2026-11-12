import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Deal, PaymentRecord, PartyType, DeliveryStatus, PaymentStatus, SavedParty } from './types';
import { 
  INITIAL_DEALS, 
  INITIAL_PAYMENTS, 
  INITIAL_PARTIES, 
  SAMPLE_DEMO_DEALS, 
  SAMPLE_DEMO_PAYMENTS, 
  SAMPLE_DEMO_PARTIES 
} from './mock-data';
import { 
  isSupabaseConfigured,
  fetchAllFromSupabase,
  syncDealToSupabase,
  deleteDealFromSupabase,
  syncPaymentToSupabase,
  deletePaymentFromSupabase,
  syncPartyToSupabase,
  deletePartyFromSupabase
} from './supabase';

interface AppStore {
  deals: Deal[];
  payments: PaymentRecord[];
  savedParties: SavedParty[];
  savedItems: string[];

  // Cloud Sync state
  isCloudConnected: boolean;
  cloudSyncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAt: string | null;

  // Modals state
  isDealModalOpen: boolean;
  editingDeal: Deal | null;
  isPaymentModalOpen: boolean;
  preselectedParty: { name: string; type: PartyType; dealId?: string } | null;
  isPrintModalOpen: boolean;
  printingDeal: Deal | null;
  isPartyModalOpen: boolean;
  editingParty: SavedParty | null;
  partyModalDefaultType: PartyType;

  setDealModalOpen: (open: boolean, deal?: Deal | null) => void;
  setPaymentModalOpen: (open: boolean, party?: { name: string; type: PartyType; dealId?: string } | null) => void;
  setPrintModalOpen: (open: boolean, deal?: Deal | null) => void;
  setPartyModalOpen: (open: boolean, party?: SavedParty | null, defaultType?: PartyType) => void;

  // Actions - Deals
  addDeal: (dealData: Omit<Deal, 'id' | 'dealNumber' | 'netProfit' | 'profitMarginPct' | 'createdAt' | 'clientPaidAmount' | 'vendorPaidAmount' | 'paymentStatus'>) => Deal;
  updateDeal: (id: string, dealData: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
  toggleDeliveryStatus: (id: string) => void;
  
  // Actions - Payments
  recordPayment: (paymentData: Omit<PaymentRecord, 'id'>) => PaymentRecord;
  deletePayment: (id: string) => void;

  // Actions - Saved Parties (Clients & Vendors Directory)
  addSavedParty: (partyData: Omit<SavedParty, 'id' | 'createdAt'>) => SavedParty;
  updateSavedParty: (id: string, partyData: Partial<SavedParty>) => void;
  deleteSavedParty: (id: string) => void;
  savePartyIfNotExists: (name: string, partyType: PartyType, extra?: Partial<SavedParty>) => SavedParty;

  // Actions - Saved Items (Quick Re-use Catalog)
  saveItemIfNotExists: (itemName: string) => void;
  deleteSavedItem: (itemName: string) => void;

  // Cloud Actions
  syncWithSupabase: () => Promise<boolean>;
  pushAllToSupabase: () => Promise<boolean>;

  // Backup & Restore
  exportBackupJSON: () => string;
  importBackupJSON: (jsonData: string) => boolean;
  loadDemoData: () => void;
  clearAllData: () => void;
  resetToDemoData: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      deals: INITIAL_DEALS,
      payments: INITIAL_PAYMENTS,
      savedParties: INITIAL_PARTIES,
      savedItems: [],

      isCloudConnected: true,
      cloudSyncStatus: 'synced',
      lastSyncedAt: null,

      isDealModalOpen: false,
      editingDeal: null,
      isPaymentModalOpen: false,
      preselectedParty: null,
      isPrintModalOpen: false,
      printingDeal: null,
      isPartyModalOpen: false,
      editingParty: null,
      partyModalDefaultType: 'Client',

      setDealModalOpen: (open, deal = null) => 
        set({ isDealModalOpen: open, editingDeal: deal }),

      setPaymentModalOpen: (open, party = null) => 
        set({ isPaymentModalOpen: open, preselectedParty: party }),

      setPrintModalOpen: (open, deal = null) => 
        set({ isPrintModalOpen: open, printingDeal: deal }),

      setPartyModalOpen: (open, party = null, defaultType = 'Client') =>
        set({ 
          isPartyModalOpen: open, 
          editingParty: party, 
          partyModalDefaultType: party ? party.partyType : defaultType 
        }),

      addSavedParty: (partyData) => {
        const cleanName = partyData.name.trim();
        const newParty: SavedParty = {
          ...partyData,
          name: cleanName,
          id: `party-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date().toISOString(),
        };

        set({ savedParties: [newParty, ...get().savedParties] });
        syncPartyToSupabase(newParty);
        return newParty;
      },

      updateSavedParty: (id, partyData) => {
        let updatedParty: SavedParty | undefined;
        set({
          savedParties: get().savedParties.map(p => {
            if (p.id !== id) return p;
            updatedParty = {
              ...p,
              ...partyData,
              name: partyData.name ? partyData.name.trim() : p.name,
            };
            return updatedParty;
          }),
        });
        if (updatedParty) {
          syncPartyToSupabase(updatedParty);
        }
      },

      deleteSavedParty: (id) => {
        set({
          savedParties: get().savedParties.filter(p => p.id !== id),
        });
        deletePartyFromSupabase(id);
      },

      savePartyIfNotExists: (name, partyType, extra = {}) => {
        const cleanName = (name || '').trim();
        if (!cleanName) {
          return {
            id: '',
            name: '',
            partyType,
            createdAt: new Date().toISOString(),
          };
        }

        const existing = get().savedParties.find(
          p => p.name.trim().toLowerCase() === cleanName.toLowerCase() && p.partyType === partyType
        );

        if (existing) {
          if (extra && Object.keys(extra).length > 0) {
            get().updateSavedParty(existing.id, extra);
          }
          return existing;
        }

        return get().addSavedParty({
          name: cleanName,
          partyType,
          ...extra,
        });
      },

      saveItemIfNotExists: (itemName: string) => {
        const clean = (itemName || '').trim();
        if (!clean) return;
        const current = get().savedItems || [];
        if (!current.some(item => item.toLowerCase() === clean.toLowerCase())) {
          set({ savedItems: [clean, ...current] });
        }
      },

      deleteSavedItem: (itemName: string) => {
        const clean = (itemName || '').trim().toLowerCase();
        set({
          savedItems: (get().savedItems || []).filter(item => item.trim().toLowerCase() !== clean)
        });
      },

      addDeal: (input) => {
        if (input.clientName) {
          get().savePartyIfNotExists(input.clientName, 'Client');
        }
        if (input.vendorName) {
          get().savePartyIfNotExists(input.vendorName, 'Vendor');
        }
        if (input.itemDescription) {
          get().saveItemIfNotExists(input.itemDescription);
        }

        const netProfit = input.sellingPrice - input.totalBuyingCost;
        const profitMarginPct = input.sellingPrice > 0 
          ? Number(((netProfit / input.sellingPrice) * 100).toFixed(2)) 
          : 0;

        const nextNum = `DEAL-${100 + get().deals.length + 1}`;
        const newDeal: Deal = {
          ...input,
          id: `deal-${Date.now()}`,
          dealNumber: nextNum,
          netProfit,
          profitMarginPct,
          deliveryStatus: input.deliveryStatus || 'Pending',
          paymentStatus: 'Unpaid',
          clientPaidAmount: 0,
          vendorPaidAmount: 0,
          createdAt: new Date().toISOString(),
        };

        set({ deals: [newDeal, ...get().deals] });
        syncDealToSupabase(newDeal);
        return newDeal;
      },

      updateDeal: (id, updateData) => {
        if (updateData.clientName) {
          get().savePartyIfNotExists(updateData.clientName, 'Client');
        }
        if (updateData.vendorName) {
          get().savePartyIfNotExists(updateData.vendorName, 'Vendor');
        }
        if (updateData.itemDescription) {
          get().saveItemIfNotExists(updateData.itemDescription);
        }

        let updatedDeal: Deal | undefined;

        set({
          deals: get().deals.map(deal => {
            if (deal.id !== id) return deal;
            const updated = { ...deal, ...updateData };

            const netProfit = updated.sellingPrice - updated.totalBuyingCost;
            const profitMarginPct = updated.sellingPrice > 0 
              ? Number(((netProfit / updated.sellingPrice) * 100).toFixed(2)) 
              : 0;

            let paymentStatus: PaymentStatus = 'Unpaid';
            if (updated.clientPaidAmount >= updated.sellingPrice) {
              paymentStatus = 'Settled';
            } else if (updated.clientPaidAmount > 0) {
              paymentStatus = 'Partial';
            }

            updatedDeal = {
              ...updated,
              netProfit,
              profitMarginPct,
              paymentStatus,
            };
            return updatedDeal;
          })
        });

        if (updatedDeal) {
          syncDealToSupabase(updatedDeal);
        }
      },

      deleteDeal: (id) => {
        set({
          deals: get().deals.filter(d => d.id !== id),
          payments: get().payments.filter(p => p.dealId !== id)
        });
        deleteDealFromSupabase(id);
      },

      toggleDeliveryStatus: (id) => {
        const deal = get().deals.find(d => d.id === id);
        if (deal) {
          const nextStatus: DeliveryStatus = deal.deliveryStatus === 'Delivered' ? 'Pending' : 'Delivered';
          get().updateDeal(id, { deliveryStatus: nextStatus });
        }
      },

      recordPayment: (paymentInput) => {
        if (paymentInput.partyName) {
          get().savePartyIfNotExists(paymentInput.partyName, paymentInput.partyType);
        }

        const newPayment: PaymentRecord = {
          ...paymentInput,
          id: `pay-${Date.now()}`,
        };

        let updatedDeals = get().deals;
        let linkedUpdatedDeal: Deal | undefined;

        if (paymentInput.dealId) {
          updatedDeals = updatedDeals.map(deal => {
            if (deal.id !== paymentInput.dealId) return deal;

            if (paymentInput.partyType === 'Client') {
              const newClientPaid = (deal.clientPaidAmount || 0) + paymentInput.amount;
              const paymentStatus: PaymentStatus = newClientPaid >= deal.sellingPrice 
                ? 'Settled' 
                : newClientPaid > 0 
                  ? 'Partial' 
                  : 'Unpaid';
              linkedUpdatedDeal = { ...deal, clientPaidAmount: newClientPaid, paymentStatus };
              return linkedUpdatedDeal;
            } else {
              const newVendorPaid = (deal.vendorPaidAmount || 0) + paymentInput.amount;
              linkedUpdatedDeal = { ...deal, vendorPaidAmount: newVendorPaid };
              return linkedUpdatedDeal;
            }
          });
        }

        set({
          payments: [newPayment, ...get().payments],
          deals: updatedDeals,
        });

        syncPaymentToSupabase(newPayment);
        if (linkedUpdatedDeal) {
          syncDealToSupabase(linkedUpdatedDeal);
        }

        return newPayment;
      },

      deletePayment: (id) => {
        set({
          payments: get().payments.filter(p => p.id !== id)
        });
        deletePaymentFromSupabase(id);
      },

      syncWithSupabase: async () => {
        if (!isSupabaseConfigured()) {
          set({ isCloudConnected: false, cloudSyncStatus: 'idle' });
          return false;
        }

        set({ cloudSyncStatus: 'syncing' });
        const cloudData = await fetchAllFromSupabase();

        if (cloudData) {
          // If cloud has records, merge or use cloud data
          if (cloudData.deals.length > 0 || cloudData.payments.length > 0 || cloudData.savedParties.length > 0) {
            const existingItems = get().savedItems || [];
            const dealItems = cloudData.deals.map(d => (d.itemDescription || '').trim()).filter(Boolean);
            const mergedItems = Array.from(new Set([...existingItems, ...dealItems]));

            set({
              deals: cloudData.deals,
              payments: cloudData.payments,
              savedParties: cloudData.savedParties,
              savedItems: mergedItems,
              isCloudConnected: true,
              cloudSyncStatus: 'synced',
              lastSyncedAt: new Date().toISOString(),
            });
            return true;
          } else {
            // Cloud is empty, push local data to cloud
            set({ isCloudConnected: true, cloudSyncStatus: 'synced', lastSyncedAt: new Date().toISOString() });
            if (get().deals.length > 0 || get().savedParties.length > 0) {
              get().pushAllToSupabase();
            }
            return true;
          }
        } else {
          set({ cloudSyncStatus: 'error' });
          return false;
        }
      },

      pushAllToSupabase: async () => {
        if (!isSupabaseConfigured()) return false;
        set({ cloudSyncStatus: 'syncing' });

        try {
          const { deals, payments, savedParties } = get();
          await Promise.all([
            ...savedParties.map(p => syncPartyToSupabase(p)),
            ...deals.map(d => syncDealToSupabase(d)),
            ...payments.map(p => syncPaymentToSupabase(p)),
          ]);
          set({ cloudSyncStatus: 'synced', isCloudConnected: true, lastSyncedAt: new Date().toISOString() });
          return true;
        } catch (e) {
          console.error('Failed to push all data to Supabase:', e);
          set({ cloudSyncStatus: 'error' });
          return false;
        }
      },

      exportBackupJSON: () => {
        const state = {
          version: '1.2',
          exportedAt: new Date().toISOString(),
          deals: get().deals,
          payments: get().payments,
          savedParties: get().savedParties,
        };
        return JSON.stringify(state, null, 2);
      },

      importBackupJSON: (jsonData: string) => {
        try {
          const parsed = JSON.parse(jsonData);
          if (Array.isArray(parsed.deals) && Array.isArray(parsed.payments)) {
            set({
              deals: parsed.deals,
              payments: parsed.payments,
              savedParties: Array.isArray(parsed.savedParties) ? parsed.savedParties : get().savedParties,
            });
            get().pushAllToSupabase();
            return true;
          }
          return false;
        } catch (e) {
          console.error('Failed to parse backup JSON:', e);
          return false;
        }
      },

      loadDemoData: () => {
        set({
          deals: SAMPLE_DEMO_DEALS,
          payments: SAMPLE_DEMO_PAYMENTS,
          savedParties: SAMPLE_DEMO_PARTIES,
        });
        get().pushAllToSupabase();
      },

      clearAllData: () => {
        set({
          deals: [],
          payments: [],
          savedParties: [],
        });
      },

      resetToDemoData: () => {
        set({
          deals: [],
          payments: [],
          savedParties: [],
        });
      }
    }),
    {
      name: 'traderhub_production_storage_v6_fresh',
    }
  )
);
