'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Printer, 
  CreditCard, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { 
  formatCurrency, 
  formatNumber, 
  formatDate, 
  getDeliveryBadgeClass, 
  getPaymentBadgeClass 
} from '@/lib/utils';

interface DealsTableProps {
  initialSearch?: string;
}

export function DealsTable({ initialSearch = '' }: DealsTableProps) {
  const { 
    deals, 
    toggleDeliveryStatus, 
    deleteDeal, 
    setDealModalOpen, 
    setPaymentModalOpen, 
    setPrintModalOpen 
  } = useAppStore();

  const [search, setSearch] = useState(initialSearch);
  const [deliveryFilter, setDeliveryFilter] = useState<'ALL' | 'Pending' | 'Delivered'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'Unpaid' | 'Partial' | 'Settled'>('ALL');

  const filteredDeals = deals.filter(deal => {
    const query = search.toLowerCase();
    const matchSearch = 
      deal.dealNumber.toLowerCase().includes(query) ||
      deal.clientName.toLowerCase().includes(query) ||
      deal.vendorName.toLowerCase().includes(query) ||
      deal.itemDescription.toLowerCase().includes(query);

    const matchDelivery = deliveryFilter === 'ALL' || deal.deliveryStatus === deliveryFilter;
    const matchPayment = paymentFilter === 'ALL' || deal.paymentStatus === paymentFilter;

    return matchSearch && matchDelivery && matchPayment;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Header & Filters */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Supply Deals & Orders
            </h2>
            <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
              {filteredDeals.length} deals
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time trade ledger with auto-computed margins, transit and collection statuses.
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search client, vendor, item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-[#5345E6] focus:bg-white transition-all"
            />
          </div>

          {/* Delivery Filter */}
          <select
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value as 'ALL' | 'Pending' | 'Delivered')}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-[#5345E6]"
          >
            <option value="ALL">Delivery: All</option>
            <option value="Pending">Pending Only</option>
            <option value="Delivered">Delivered</option>
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as 'ALL' | 'Unpaid' | 'Partial' | 'Settled')}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-[#5345E6]"
          >
            <option value="ALL">Payment: All</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partial">Partial</option>
            <option value="Settled">Settled</option>
          </select>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Deal / Date</th>
              <th className="py-3 px-4">Client (Buyer)</th>
              <th className="py-3 px-4">Vendor (Supplier)</th>
              <th className="py-3 px-4">Goods & Quantity</th>
              <th className="py-3 px-4 text-right">Procurement Cost</th>
              <th className="py-3 px-4 text-right">Client Bill (৳)</th>
              <th className="py-3 px-4 text-right">Net Profit (৳)</th>
              <th className="py-3 px-4 text-center">Delivery Status</th>
              <th className="py-3 px-4 text-center">Payment Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deals.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-16 text-center text-xs">
                  <div className="max-w-xs mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#5345E6]/10 text-[#5345E6] flex items-center justify-center mx-auto">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">No supply deals logged yet</p>
                      <p className="text-slate-400 text-xs mt-1">Start tracking your client orders, vendor rates, and delivery statuses.</p>
                    </div>
                    <button
                      onClick={() => setDealModalOpen(true)}
                      className="px-4 py-2 bg-[#5345E6] hover:bg-[#4335D6] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>+ Log Your First Deal</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : filteredDeals.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                  No deals match your search/filter criteria.
                </td>
              </tr>
            ) : (
              filteredDeals.map((deal) => {
                const clientDue = Math.max(0, deal.sellingPrice - (deal.clientPaidAmount || 0));

                return (
                  <tr key={deal.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Deal Number & Date */}
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-slate-900 font-mono block">
                        {deal.dealNumber}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {formatDate(deal.date)}
                      </span>
                    </td>

                    {/* Client Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <div className="truncate max-w-[150px]">{deal.clientName}</div>
                      {clientDue > 0 ? (
                        <span className="text-[10px] text-rose-600 font-medium block">
                          Due: {formatCurrency(clientDue)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-medium block">
                          Fully Paid
                        </span>
                      )}
                    </td>

                    {/* Vendor Name */}
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="truncate max-w-[140px] font-medium">{deal.vendorName}</div>
                      <span className="text-[10px] text-slate-400 block">
                        Rate: {formatCurrency(deal.vendorRate)}/{deal.unit}
                      </span>
                    </td>

                    {/* Item & Quantity */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 truncate max-w-[160px]">
                        {deal.itemDescription}
                      </div>
                      <span className="text-[11px] text-slate-600 tabular-nums">
                        {formatNumber(deal.quantity)} {deal.unit}
                      </span>
                    </td>

                    {/* Total Buying Cost */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-slate-800 tabular-nums">
                        {formatCurrency(deal.totalBuyingCost)}
                      </div>
                      {deal.transportCost > 0 && (
                        <span className="text-[10px] text-slate-400 tabular-nums block">
                          incl. {formatCurrency(deal.transportCost)} freight
                        </span>
                      )}
                    </td>

                    {/* Selling Price */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-extrabold text-slate-900 tabular-nums text-sm">
                        {formatCurrency(deal.sellingPrice)}
                      </div>
                    </td>

                    {/* Net Profit & Margin */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-black text-emerald-600 tabular-nums text-sm">
                        +{formatCurrency(deal.netProfit)}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 tabular-nums">
                        {deal.profitMarginPct.toFixed(1)}%
                      </span>
                    </td>

                    {/* Delivery Status (Interactive Toggle) */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleDeliveryStatus(deal.id)}
                        title="Click to toggle delivery status"
                        className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full cursor-pointer transition-all hover:scale-105 ${getDeliveryBadgeClass(deal.deliveryStatus)}`}
                      >
                        {deal.deliveryStatus === 'Delivered' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-600" />
                        )}
                        <span>{deal.deliveryStatus}</span>
                      </button>
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block text-[11px] px-2.5 py-1 rounded-full ${getPaymentBadgeClass(deal.paymentStatus)}`}>
                        {deal.paymentStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Quick Print Button */}
                        <button
                          onClick={() => setPrintModalOpen(true, deal)}
                          title="Print Invoice or Delivery Challan"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <Printer className="w-4 h-4 text-slate-600" />
                        </button>

                        {/* Quick Record Payment */}
                        <button
                          onClick={() => setPaymentModalOpen(true, { 
                            name: deal.clientName, 
                            type: 'Client', 
                            dealId: deal.id 
                          })}
                          title="Record Client Payment for this deal"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>

                        {/* Edit Deal */}
                        <button
                          onClick={() => setDealModalOpen(true, deal)}
                          title="Edit Deal Details"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Deal */}
                        <button
                          onClick={() => {
                            if (confirm(`Delete deal ${deal.dealNumber}? This action cannot be undone.`)) {
                              deleteDeal(deal.id);
                            }
                          }}
                          title="Delete Deal"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
