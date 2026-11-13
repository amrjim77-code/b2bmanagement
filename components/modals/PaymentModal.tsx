'use client';

import React, { useState } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, PlusCircle, Check, Zap, ListFilter } from 'lucide-react';
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

  // Unsettled deals with pending dues for this party
  const openDealsWithDue = partyDeals.map(d => {
    const due = partyType === 'Client' 
      ? Math.max(0, d.sellingPrice - (d.clientPaidAmount || 0))
      : Math.max(0, d.totalBuyingCost - (d.vendorPaidAmount || 0));
    return { ...d, due };
  }).filter(d => d.due > 0);

  // Total balance due for this party
  const partyTotalDue = openDealsWithDue.reduce((sum, d) => sum + d.due, 0);

  // Mode: 'outstanding' (clear full balance across all deals) vs 'specific' (pay one deal)
  const [allocationMode, setAllocationMode] = useState<'outstanding' | 'specific'>(
    preselectedParty?.dealId ? 'specific' : 'outstanding'
  );

  // Initial amount calculation
  const [amount, setAmount] = useState<number>(() => {
    if (preselectedParty?.dealId) {
      const deal = deals.find(d => d.id === preselectedParty.dealId);
      if (deal) {
        return preselectedParty.type === 'Client'
          ? Math.max(0, deal.sellingPrice - (deal.clientPaidAmount || 0))
          : Math.max(0, deal.totalBuyingCost - (deal.vendorPaidAmount || 0));
      }
    }
    return partyTotalDue > 0 ? partyTotalDue : 0;
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  // Selected specific deal
  const selectedDeal = deals.find(d => d.id === dealId);
  const selectedDealDue = selectedDeal
    ? (partyType === 'Client'
        ? Math.max(0, selectedDeal.sellingPrice - (selectedDeal.clientPaidAmount || 0))
        : Math.max(0, selectedDeal.totalBuyingCost - (selectedDeal.vendorPaidAmount || 0)))
    : 0;

  // Change Party Type
  const handlePartyTypeChange = (type: PartyType) => {
    setPartyType(type);
    setPartyName('');
    setDealId('');
    setAmount(0);
  };

  // Change Party Name
  const handlePartyNameChange = (name: string) => {
    setPartyName(name);
    setDealId('');
    
    // Auto calculate new party's total due
    const matching = deals.filter(d => typeMatch(d, partyType, name));
    const totalDue = matching.reduce((sum, d) => {
      const due = partyType === 'Client'
        ? Math.max(0, d.sellingPrice - (d.clientPaidAmount || 0))
        : Math.max(0, d.totalBuyingCost - (d.vendorPaidAmount || 0));
      return sum + due;
    }, 0);

    if (allocationMode === 'outstanding' && totalDue > 0) {
      setAmount(totalDue);
    }
  };

  function typeMatch(deal: any, type: PartyType, name: string) {
    const target = (name || '').trim().toLowerCase();
    return type === 'Client'
      ? deal.clientName.trim().toLowerCase() === target
      : deal.vendorName.trim().toLowerCase() === target;
  }

  // Switch to Outstanding Mode
  const handleSelectOutstandingMode = () => {
    setAllocationMode('outstanding');
    setDealId('');
    if (partyTotalDue > 0) {
      setAmount(partyTotalDue);
    }
  };

  // Switch to Specific Deal Mode
  const handleSelectSpecificMode = () => {
    setAllocationMode('specific');
    if (openDealsWithDue.length > 0 && !dealId) {
      const firstDueDeal = openDealsWithDue[0];
      setDealId(firstDueDeal.id);
      setAmount(firstDueDeal.due);
    } else if (partyDeals.length > 0 && !dealId) {
      setDealId(partyDeals[0].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName || amount <= 0) return;

    recordPayment({
      date,
      partyType,
      partyName,
      dealId: allocationMode === 'specific' ? (dealId || undefined) : undefined,
      settleOutstanding: allocationMode === 'outstanding',
      amount,
      paymentMethod,
      reference,
      notes: notes || (allocationMode === 'outstanding' ? 'Settled full outstanding balance across all open deals' : undefined),
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
            onClick={() => handlePartyTypeChange('Client')}
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
            onClick={() => handlePartyTypeChange('Vendor')}
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

      {/* Party Name Selector */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-bold text-slate-700">
            {partyType === 'Client' ? 'Client / Customer Name *' : 'Vendor / Supplier Name *'}
          </label>
          <button
            type="button"
            onClick={() => setPartyModalOpen(true, null, partyType)}
            className="text-[11px] font-bold text-[#5345E6] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <PlusCircle className="w-3 h-3" />
            <span>+ Save Contact</span>
          </button>
        </div>

        <input
          type="text"
          list="payment-parties-list"
          placeholder={`Select or type ${partyType.toLowerCase()} name...`}
          value={partyName}
          onChange={(e) => handlePartyNameChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-hidden focus:border-[#5345E6] focus:bg-white"
          required
        />

        <datalist id="payment-parties-list">
          {allPartyNames.map(name => {
            const saved = savedList.find(p => p.name === name);
            return (
              <option key={name} value={name}>
                {saved?.phone ? `${name} (${saved.phone})` : name}
              </option>
            );
          })}
        </datalist>

        {/* Selected Party Balance Overview Bar */}
        {partyName.trim() && (
          <div className="mt-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              {matchedSavedParty ? (
                <span className="text-[#5345E6] font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Saved {partyType}</span>
                </span>
              ) : (
                <span className="text-slate-400">Directory Contact</span>
              )}
              {matchedSavedParty?.phone && (
                <span className="text-slate-500 font-medium">
                  • {matchedSavedParty.phone}
                </span>
              )}
            </div>
            <div>
              <span className="text-slate-400 mr-1.5 font-medium">Total Ledger Due:</span>
              <span className={`font-black tabular-nums text-xs ${partyTotalDue > 0 ? (partyType === 'Client' ? 'text-amber-600' : 'text-rose-600') : 'text-emerald-600'}`}>
                {formatCurrency(partyTotalDue)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* PAYMENT ALLOCATION OPTION: BOTH OPTIONS PROVIDED */}
      {partyName.trim() && (
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-800 block">
            Payment Settlement Option:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* OPTION 1: PAY TOTAL OUTSTANDING (AUTO-CLEAR ALL DUES) */}
            <button
              type="button"
              onClick={handleSelectOutstandingMode}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                allocationMode === 'outstanding'
                  ? 'border-[#5345E6] bg-[#5345E6]/5 ring-2 ring-[#5345E6]/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black flex items-center gap-1.5 text-slate-900">
                  <Zap className="w-3.5 h-3.5 text-[#5345E6]" />
                  <span>Pay Total Outstanding</span>
                </span>
                <span className="text-xs font-black text-[#5345E6] tabular-nums">
                  {formatCurrency(partyTotalDue)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium mt-1 leading-tight">
                Automatically matches & clears out all open dues across all orders. No need to select items individually.
              </p>
            </button>

            {/* OPTION 2: PAY SPECIFIC DEAL / ITEM */}
            <button
              type="button"
              onClick={handleSelectSpecificMode}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                allocationMode === 'specific'
                  ? 'border-[#5345E6] bg-[#5345E6]/5 ring-2 ring-[#5345E6]/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black flex items-center gap-1.5 text-slate-900">
                  <ListFilter className="w-3.5 h-3.5 text-[#5345E6]" />
                  <span>Pay Specific Order</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {partyDeals.length} orders
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium mt-1 leading-tight">
                Select a single specific supply deal or commodity order to credit individually.
              </p>
            </button>
          </div>

          {/* Outstanding Mode: Live Preview of Deals Being Cleared */}
          {allocationMode === 'outstanding' && (
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#5345E6]">
                <span>⚡ Auto-Clearing Dues Across ({openDealsWithDue.length}) Unsettled Order{openDealsWithDue.length !== 1 ? 's' : ''}:</span>
                <span className="font-black tabular-nums">{formatCurrency(partyTotalDue)} Total</span>
              </div>
              {openDealsWithDue.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">
                  All past orders for this {partyType.toLowerCase()} are already fully settled.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-0.5 max-h-24 overflow-y-auto">
                  {openDealsWithDue.map(deal => (
                    <div
                      key={deal.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-purple-200/80 text-[10px] font-medium text-slate-700 shadow-2xs"
                    >
                      <span className="font-bold text-[#5345E6]">{deal.dealNumber}:</span>
                      <span className="truncate max-w-[120px]">{deal.itemDescription}</span>
                      <span className="text-amber-600 font-bold tabular-nums">({formatCurrency(deal.due)})</span>
                      <span className="text-emerald-600 font-black">✓ Clears</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Specific Deal Mode: Deal Dropdown */}
          {allocationMode === 'specific' && (
            <div className="pt-1">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Select Specific Supply Deal to Credit *
              </label>
              <select
                value={dealId}
                onChange={(e) => {
                  setDealId(e.target.value);
                  const matched = deals.find(d => d.id === e.target.value);
                  if (matched) {
                    const due = partyType === 'Client'
                      ? Math.max(0, matched.sellingPrice - (matched.clientPaidAmount || 0))
                      : Math.max(0, matched.totalBuyingCost - (matched.vendorPaidAmount || 0));
                    if (due > 0) setAmount(due);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] focus:bg-white font-medium"
                required={allocationMode === 'specific'}
              >
                <option value="">-- Choose Order to Credit --</option>
                {partyDeals.map(deal => {
                  const due = partyType === 'Client' 
                    ? Math.max(0, deal.sellingPrice - (deal.clientPaidAmount || 0))
                    : Math.max(0, deal.totalBuyingCost - (deal.vendorPaidAmount || 0));
                  return (
                    <option key={deal.id} value={deal.id}>
                      {deal.dealNumber}: {deal.itemDescription} (Outstanding Due: {formatCurrency(due)})
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Amount & Date Input */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-900">
              Amount (৳ BDT) *
            </label>
            {/* Quick 1-Click Match Due Button */}
            {allocationMode === 'outstanding' && partyTotalDue > 0 && amount !== partyTotalDue && (
              <button
                type="button"
                onClick={() => setAmount(partyTotalDue)}
                className="text-[10px] text-[#5345E6] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Match Full Due: {formatCurrency(partyTotalDue)}</span>
              </button>
            )}
            {allocationMode === 'specific' && selectedDealDue > 0 && amount !== selectedDealDue && (
              <button
                type="button"
                onClick={() => setAmount(selectedDealDue)}
                className="text-[10px] text-[#5345E6] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Match Deal Due: {formatCurrency(selectedDealDue)}</span>
              </button>
            )}
          </div>
          <input
            type="number"
            step="any"
            min="1"
            placeholder="e.g. 50000"
            value={amount || ''}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-50 border-2 border-[#5345E6]/40 rounded-xl px-3 py-2 text-sm text-slate-900 font-black focus:outline-hidden focus:border-[#5345E6] focus:bg-white tabular-nums"
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
            placeholder={allocationMode === 'outstanding' ? 'Cleared full outstanding balance' : 'e.g. Advance paid for order'}
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
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
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
                Settle full outstanding balances or credit specific supply deals
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
