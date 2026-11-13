export type DeliveryStatus = 'Pending' | 'Delivered';
export type PaymentStatus = 'Unpaid' | 'Partial' | 'Settled';
export type PaymentMethod = 'Cash' | 'Bank' | 'bKash' | 'Nagad';
export type PartyType = 'Client' | 'Vendor';

export interface DealItem {
  id: string;
  itemDescription: string;
  quantity: number;
  unit: string;
  vendorRate: number;    // buying rate per unit
  sellingRate: number;   // selling rate per unit
  totalCost?: number;    // quantity * vendorRate
  totalSelling?: number; // quantity * sellingRate
}

export interface Deal {
  id: string;
  dealNumber: string; // e.g. DEAL-101
  date: string;
  clientName: string;
  vendorName: string;
  itemDescription: string;
  quantity: number;
  unit: string; // ton, kg, pcs, carton, bag, etc.
  items?: DealItem[]; // Support for multiple items in a single supply deal
  
  // Financials
  vendorRate: number;      // per unit or total
  transportCost: number;   // logistics / freight / labor
  totalBuyingCost: number; // (vendorRate * quantity) + transportCost
  sellingPrice: number;    // total billed to client
  netProfit: number;       // sellingPrice - totalBuyingCost
  profitMarginPct: number; // (netProfit / sellingPrice) * 100

  // Statuses
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
  clientPaidAmount: number;
  vendorPaidAmount: number;

  notes?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  partyType: PartyType;
  partyName: string;
  dealId?: string;
  dealNumber?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  settleOutstanding?: boolean;
}

export interface PartySummary {
  name: string;
  partyType: PartyType;
  phone?: string;
  totalBilled: number;
  totalPaid: number;
  balanceDue: number;
  dealsCount: number;
  lastActiveDate: string;
}

export interface SavedParty {
  id: string;
  name: string;
  partyType: PartyType;
  phone?: string;
  contactPerson?: string;
  address?: string;
  paymentTerms?: string;
  notes?: string;
  createdAt: string;
}

