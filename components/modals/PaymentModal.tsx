'use client';

import React, { useState } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, PlusCircle, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { PartyType, PaymentMethod, SavedParty } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface PaymentFormProps {
  preselectedParty: { name: string; type: PartyType; dealId?: string } | null;
}

function PaymentForm({ preselectedParty }: PaymentFormProps) {
  const { deals, recordPayment, setPaymentModalOpen, savedParties, setPartyModalOpen } = useAppStore();

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [partyType, setPartyType] = useState<PartyType>(preselectedParty?.type || 'Client');
  const [partyName, setPartyName] = useState(preselectedParty?.name || '');
  const [dealId, setDealId] = useState(preselectedParty?.dealId || '');
  const [amount, setAmount] = useState<number>(() => {
    if (preselectedParty?.dealId) {
      const deal = deals.find(d => d.id === preselectedParty.dealId);
      if (deal) {
        return preselectedParty.type === 'Client'
          ? Math.max(0, deal.sellingPrice - (deal.clientPaidAmount || 0))
          : Math.max(0, deal.totalBuyingCost - (deal.vendorPaidAmount || 0));
      }
    }
    return 0;
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  // Extract all available parties (both saved and historical)
  const savedList = savedParties.filter(p => p.partyType === partyType);
  const historicalNames = Array.from(new Set(
    deals.map(d => partyType === 'Client' ? d.clientName : d.vendorName)
  )).filter(Boolean);

  // All combined party names without duplicates
  const allPartyNames = Array.from(new Set([
    ...savedList.map(p => p.name),
    ...historicalNames
  ]));

  // Selected party match
  const matchedSavedParty: SavedParty | undefined = savedList.find(
    p => p.name.toLowerCase() === partyName.trim().toLowerCase()
  );

  // Deals matching current party
  const partyDeals = deals.filter(d => 
    partyType === 'Client' ? d.clientName === partyName : d.vendorName === partyName
  );

  // Total balance due for this party
  const partyTotalDue = partyDeals.reduce((sum, d) => {
    return sum + (partyType === 'Client' 
      ? Math.max(0, d.sellingPrice - (d.clientPaidAmount || 0))
      : Math.max(0, d.totalBuyingCost - (d.vendorPaidAmount || 0)));
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName || amount <= 0) return;

    recordPayment({
      date,
      partyType,
      partyName,
      dealId: dealId || undefined,
      amount,
      paymentMethod,
      reference,
      notes,
    });

    setPaymentModalOpen(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {/* Transaction Direction Toggle */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1">Payment Direction</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { 
              setPartyType('Client'); 
              setPartyName(allPartyNames[0] || ''); 
              setDealId(''); 
            }}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              partyType === 'Client'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-400/20 shadow-xs'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            <span>Money Received (From Client)</span>
          </button>

          <button
            type="button"
            onClick={() => { 
              setPartyType('Vendor'); 
              setPartyName(''); 
              setDealId(''); 
            }}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              partyType === 'Vendor'
                ? 'border-rose-300 bg-rose-50 text-rose-800 ring-1 ring-rose-400/20 shadow-xs'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
            <span>Money Paid Out (To Supplier)</span>
          </button>
        </div>
      </div>

      {/* Party Name with Reusable Autocomplete & Quick Add */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-bold text-slate-700">
            {partyType === 'Client' ? 'Client Name (Who Paid You) *' : 'Vendor / Supplier (Whom You Paid) *'}
          </label>
          <button
            type="button"
            onClick={() => setPartyModalOpen(true, null, partyType)}
            className="text-[11px] font-bold text-[#5345E6] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <PlusCircle className="w-3 h-3" />
            <span>+ Save New {partyType}</span>
          </button>
        </div>

        <input
          type="text"
          list="partySuggestions"
          placeholder={partyType === 'Client' ? 'Select or type client name...' : 'Select or type vendor name...'}
          value={partyName}
          onChange={(e) => { setPartyName(e.target.value); setDealId(''); }}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] focus:bg-white font-semibold"
          required
        />
        <datalist id="partySuggestions">
          {allPartyNames.map(name => {
            const saved = savedList.find(p => p.name === name);
            return (
              <option key={name} value={name}>
                {saved?.phone ? `${name} (${saved.phone})` : name}
              </option>
            );
          })}
        </datalist>

        {/* Selected Party Summary Bar */}
        {partyName.trim() && (
          <div className="mt-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              {matchedSavedParty ? (
                <span className="text-[#5345E6] font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Saved {partyType}</span>
                </span>
              ) : (
                <span className="text-slate-400">New Contact</span>
              )}
              {matchedSavedParty?.phone && (
                <span className="text-slate-500 font-medium">
                  • {matchedSavedParty.phone}
                </span>
              )}
            </div>
            <div>
              <span className="text-slate-400 mr-1">Outstanding:</span>
              <span className={`font-black tabular-nums ${partyTotalDue > 0 ? (partyType === 'Client' ? 'text-amber-600' : 'text-rose-600') : 'text-emerald-600'}`}>
                {formatCurrency(partyTotalDue)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Linked Deal Selector */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1">
          Link to Specific Supply Deal (Optional)
        </label>
        <select
          value={dealId}
          onChange={(e) => {
            setDealId(e.target.value);
            const matched = deals.find(d => d.id === e.target.value);
            if (matched) {
              if (partyType === 'Client') {
                const due = Math.max(0, matched.sellingPrice - (matched.clientPaidAmount || 0));
                if (due > 0) setAmount(due);
              } else {
                const due = Math.max(0, matched.totalBuyingCost - (matched.vendorPaidAmount || 0));
                if (due > 0) setAmount(due);
              }
            }
          }}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] focus:bg-white font-medium"
        >
          <option value="">General Account Balance (No specific deal)</option>
          {partyDeals.map(deal => (
            <option key={deal.id} value={deal.id}>
              {deal.dealNumber}: {deal.itemDescription} (Outstanding Due: {formatCurrency(
                partyType === 'Client' 
                  ? Math.max(0, deal.sellingPrice - (deal.clientPaidAmount || 0))
                  : Math.max(0, deal.totalBuyingCost - (deal.vendorPaidAmount || 0))
              )})
            </option>
          ))}
        </select>
      </div>

      {/* Amount & Date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-900 block mb-1">
            Amount Received / Paid (৳ BDT) *
          </label>
          <input
            type="number"
            step="any"
            min="1"
            placeholder="e.g. 50000"
            value={amount || ''}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-black focus:outline-hidden focus:border-[#5345E6] focus:bg-white tabular-nums"
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Payment Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] focus:bg-white font-medium"
            required
          />
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1">Payment Method</label>
        <div className="grid grid-cols-4 gap-2">
          {(['Bank', 'Cash', 'bKash', 'Nagad'] as PaymentMethod[]).map(method => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                paymentMethod === method
                  ? 'border-[#5345E6] bg-[#5345E6]/10 text-[#5345E6] font-extrabold shadow-2xs'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Reference & Notes */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Trx ID / Cheque / Ref</label>
          <input
            type="text"
            placeholder="e.g. TrxID 99281 / City Bank EFT"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] focus:bg-white font-medium"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Remittance Note</label>
          <input
            type="text"
            placeholder="e.g. Advance paid via bKash"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] focus:bg-white font-medium"
          />
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setPaymentModalOpen(false)}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer ${
            partyType === 'Client' 
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' 
              : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
          }`}
        >
          {partyType === 'Client' ? 'Record Client Receipt' : 'Record Vendor Payout'}
        </button>
      </div>
    </form>
  );
}

export function PaymentModal() {
  const { isPaymentModalOpen, preselectedParty, setPaymentModalOpen } = useAppStore();

  if (!isPaymentModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/75">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold shadow-xs ${
              preselectedParty?.type === 'Vendor' ? 'bg-rose-600' : 'bg-emerald-600'
            }`}>
              {preselectedParty?.type === 'Vendor' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Record Payment Remittance (BDT)
              </h3>
              <p className="text-xs text-slate-500">
                Log money received from buyers or payouts made to suppliers
              </p>
            </div>
          </div>
          <button
            onClick={() => setPaymentModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Self-contained Form with Key for clean state initialization */}
        <PaymentForm 
          key={`${preselectedParty?.name || 'new'}-${preselectedParty?.type || 'client'}-${preselectedParty?.dealId || 'none'}`} 
          preselectedParty={preselectedParty} 
        />
      </div>
    </div>
  );
}
