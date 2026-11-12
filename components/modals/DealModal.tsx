'use client';

import React, { useState } from 'react';
import { X, TrendingUp, PlusCircle, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Deal, DeliveryStatus, SavedParty } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface DealFormProps {
  editingDeal: Deal | null;
}

function DealForm({ editingDeal }: DealFormProps) {
  const { 
    addDeal, 
    updateDeal, 
    setDealModalOpen, 
    savedParties, 
    setPartyModalOpen,
    deals,
    savedItems,
    deleteSavedItem
  } = useAppStore();

  const [date, setDate] = useState(editingDeal?.date || new Date().toISOString().slice(0, 10));
  const [clientName, setClientName] = useState(editingDeal?.clientName || '');
  const [vendorName, setVendorName] = useState(editingDeal?.vendorName || '');
  const [itemDescription, setItemDescription] = useState(editingDeal?.itemDescription || '');
  const [quantity, setQuantity] = useState(editingDeal?.quantity || 1);
  const [unit, setUnit] = useState(editingDeal?.unit || 'ton');
  const [vendorRate, setVendorRate] = useState(editingDeal?.vendorRate || 0);
  const [transportCost, setTransportCost] = useState(editingDeal?.transportCost || 0);
  const [sellingPrice, setSellingPrice] = useState(editingDeal?.sellingPrice || 0);
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>(editingDeal?.deliveryStatus || 'Pending');
  const [notes, setNotes] = useState(editingDeal?.notes || '');

  // Live Calculations
  const goodsCost = vendorRate * quantity;
  const totalBuyingCost = goodsCost + transportCost;
  const netProfit = sellingPrice - totalBuyingCost;
  const profitMarginPct = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;

  // Saved clients and vendors lists
  const savedClients = savedParties.filter(p => p.partyType === 'Client');
  const savedVendors = savedParties.filter(p => p.partyType === 'Vendor');

  // Matched selected party
  const matchedClient: SavedParty | undefined = savedClients.find(
    c => c.name.toLowerCase() === clientName.trim().toLowerCase()
  );
  const matchedVendor: SavedParty | undefined = savedVendors.find(
    v => v.name.toLowerCase() === vendorName.trim().toLowerCase()
  );

  // Unique available items from saved catalog and existing deals
  const availableItems = React.useMemo(() => {
    const list: string[] = [];
    (savedItems || []).forEach(item => {
      const clean = item?.trim();
      if (clean && !list.some(x => x.toLowerCase() === clean.toLowerCase())) {
        list.push(clean);
      }
    });
    deals.forEach(d => {
      const clean = d.itemDescription?.trim();
      if (clean && !list.some(x => x.toLowerCase() === clean.toLowerCase())) {
        list.push(clean);
      }
    });
    return list;
  }, [savedItems, deals]);

  const handleSelectSavedItem = (item: string) => {
    setItemDescription(item);
    // Auto-fill unit if a prior deal used this item
    const prior = deals.find(d => d.itemDescription?.trim().toLowerCase() === item.toLowerCase());
    if (prior && prior.unit) {
      setUnit(prior.unit);
    }
    if (prior && prior.vendorRate && vendorRate === 0) {
      setVendorRate(prior.vendorRate);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingDeal) {
      updateDeal(editingDeal.id, {
        date,
        clientName,
        vendorName,
        itemDescription,
        quantity,
        unit,
        vendorRate,
        transportCost,
        totalBuyingCost,
        sellingPrice,
        netProfit,
        profitMarginPct: Number(profitMarginPct.toFixed(2)),
        deliveryStatus,
        notes,
      });
    } else {
      addDeal({
        date,
        clientName,
        vendorName,
        itemDescription,
        quantity,
        unit,
        vendorRate,
        transportCost,
        totalBuyingCost,
        sellingPrice,
        deliveryStatus,
        notes,
      });
    }

    setDealModalOpen(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {/* Date & Parties */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Deal Date */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Deal Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] focus:bg-white font-medium"
            required
          />
        </div>

        {/* Client Name with Reusable Dropdown / Autocomplete */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700">Client Name (Buyer) *</label>
            <button
              type="button"
              onClick={() => setPartyModalOpen(true, null, 'Client')}
              className="text-[11px] font-bold text-[#5345E6] hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <PlusCircle className="w-3 h-3" />
              <span>+ Save New</span>
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              list="saved-clients-list"
              placeholder="Select or type client name..."
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] focus:bg-white font-semibold"
              required
            />
            <datalist id="saved-clients-list">
              {savedClients.map((client) => (
                <option key={client.id} value={client.name}>
                  {client.phone ? `${client.name} (${client.phone})` : client.name}
                </option>
              ))}
            </datalist>
          </div>
          {matchedClient ? (
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#5345E6] font-medium truncate">
              <Check className="w-3 h-3 text-[#5345E6] shrink-0" />
              <span>Saved Client • {matchedClient.paymentTerms || 'Standard Terms'}</span>
            </div>
          ) : clientName.trim() ? (
            <span className="text-[10px] text-slate-400 mt-1 block">
              Auto-saves to your directory on submit
            </span>
          ) : null}
        </div>

        {/* Vendor Name with Reusable Dropdown / Autocomplete */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700">Vendor / Mill (Supplier) *</label>
            <button
              type="button"
              onClick={() => setPartyModalOpen(true, null, 'Vendor')}
              className="text-[11px] font-bold text-amber-700 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <PlusCircle className="w-3 h-3" />
              <span>+ Save New</span>
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              list="saved-vendors-list"
              placeholder="Select or type vendor name..."
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] focus:bg-white font-semibold"
              required
            />
            <datalist id="saved-vendors-list">
              {savedVendors.map((vendor) => (
                <option key={vendor.id} value={vendor.name}>
                  {vendor.phone ? `${vendor.name} (${vendor.phone})` : vendor.name}
                </option>
              ))}
            </datalist>
          </div>
          {matchedVendor ? (
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-700 font-medium truncate">
              <Check className="w-3 h-3 text-amber-700 shrink-0" />
              <span>Saved Vendor • {matchedVendor.paymentTerms || 'Standard Terms'}</span>
            </div>
          ) : vendorName.trim() ? (
            <span className="text-[10px] text-slate-400 mt-1 block">
              Auto-saves to your directory on submit
            </span>
          ) : null}
        </div>
      </div>

      {/* Quick Clickable Suggestions If Parties Are Saved */}
      {(savedClients.length > 0 && !clientName) && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Saved Clients:</span>
          {savedClients.slice(0, 4).map(c => (
            <button
              type="button"
              key={c.id}
              onClick={() => setClientName(c.name)}
              className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-[#5345E6]/10 hover:text-[#5345E6] text-[11px] font-medium text-slate-700 transition-colors shrink-0 cursor-pointer"
            >
              + {c.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Goods & Quantity */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 block">Goods Description / Item *</label>
            {availableItems.length > 0 && (
              <span className="text-[10px] text-slate-400 font-semibold">
                {availableItems.length} saved
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              list="saved-items-datalist"
              placeholder="e.g. 500W Deformed Steel Rebar (16mm)"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] focus:bg-white font-medium"
              required
            />
            <datalist id="saved-items-datalist">
              {availableItems.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>

          {/* Quick Clickable Saved Item Chips */}
          {availableItems.length > 0 && (
            <div className="mt-2 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Click to re-use saved item:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-0.5">
                {availableItems.map((item) => {
                  const isSelected = itemDescription.trim().toLowerCase() === item.toLowerCase();
                  return (
                    <div
                      key={item}
                      className={`inline-flex items-center rounded-lg text-[11px] transition-all border ${
                        isSelected
                          ? 'bg-[#5345E6] text-white border-[#5345E6] shadow-xs font-bold'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-[#5345E6]/40 font-medium'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectSavedItem(item)}
                        className="px-2.5 py-1 text-left cursor-pointer flex items-center gap-1"
                        title={`Click to fill "${item}"`}
                      >
                        <span className="text-[10px]">📦</span>
                        <span>{item}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSavedItem(item);
                        }}
                        className={`pr-1.5 pl-0.5 hover:text-red-500 opacity-60 hover:opacity-100 cursor-pointer text-xs leading-none ${
                          isSelected ? 'text-white/80 hover:text-white' : 'text-slate-400'
                        }`}
                        title={`Remove "${item}" from saved list`}
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {itemDescription.trim() && !availableItems.some(i => i.toLowerCase() === itemDescription.trim().toLowerCase()) && (
            <span className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <span>✓</span>
              <span>Will be saved automatically for one-click re-use</span>
            </span>
          )}
        </div>

        <div className="sm:col-span-3">
          <label className="text-xs font-bold text-slate-700 block mb-1">Quantity</label>
          <input
            type="number"
            step="any"
            min="0.01"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] focus:bg-white tabular-nums font-semibold"
            required
          />
        </div>

        <div className="sm:col-span-3">
          <label className="text-xs font-bold text-slate-700 block mb-1">Unit</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] focus:bg-white font-medium"
          >
            <option value="ton">Ton</option>
            <option value="kg">Kg</option>
            <option value="pcs">Pcs</option>
            <option value="carton">Carton</option>
            <option value="bag">Bag (50kg)</option>
            <option value="cft">CFT</option>
            <option value="bundle">Bundle</option>
          </select>
        </div>
      </div>

      {/* Cost & Pricing Calculation Grid */}
      <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
          Financial & Margin Breakdown (BDT ৳)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Vendor Unit Rate (৳/{unit})
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={vendorRate || ''}
              onChange={(e) => setVendorRate(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] tabular-nums font-semibold"
              required
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Goods Cost: {formatCurrency(goodsCost)}
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Transport / Truck Fare (৳)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={transportCost || ''}
              onChange={(e) => setTransportCost(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] tabular-nums font-semibold"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Direct site delivery freight
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Selling Price (Client Bill ৳) *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={sellingPrice || ''}
              onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border-2 border-[#5345E6]/40 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-[#5345E6] tabular-nums font-bold"
              required
            />
            <span className="text-[10px] text-[#5345E6] font-semibold mt-0.5 block">
              Total Invoiced to Client
            </span>
          </div>
        </div>

        {/* Live Net Profit Summary Pill Bar */}
        <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-400 text-[11px] block">Total Buying Cost:</span>
              <span className="font-bold text-slate-800 tabular-nums">
                {formatCurrency(totalBuyingCost)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Net Margin:</span>
              <span className={`font-black tabular-nums ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {profitMarginPct.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs text-right">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
              Calculated Net Profit
            </span>
            <span className={`text-base font-black tabular-nums ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(netProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Delivery Status & Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Delivery Status</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDeliveryStatus('Pending')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                deliveryStatus === 'Pending'
                  ? 'border-amber-300 bg-amber-50 text-amber-800 ring-1 ring-amber-400/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              In Transit / Pending
            </button>
            <button
              type="button"
              onClick={() => setDeliveryStatus('Delivered')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                deliveryStatus === 'Delivered'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-400/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Delivered
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Deal Notes / Site Contact</label>
          <input
            type="text"
            placeholder="e.g. Truck: Dhaka Metro-Ta 11-4029, Driver: 017..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] focus:bg-white font-medium"
          />
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setDealModalOpen(false)}
          className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 text-xs font-bold text-white bg-[#5345E6] hover:bg-[#4335D6] rounded-xl transition-all shadow-sm shadow-[#5345E6]/30 active:scale-95 cursor-pointer"
        >
          {editingDeal ? 'Update Deal' : 'Save Supply Deal'}
        </button>
      </div>
    </form>
  );
}

export function DealModal() {
  const { isDealModalOpen, editingDeal, setDealModalOpen } = useAppStore();

  if (!isDealModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/75">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5345E6] text-white flex items-center justify-center font-bold shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {editingDeal ? `Edit Deal (${editingDeal.dealNumber})` : 'Log New Supply Deal'}
              </h3>
              <p className="text-xs text-slate-500">
                Calculate your buying cost, transport, client bill, and net profit in BDT
              </p>
            </div>
          </div>
          <button
            onClick={() => setDealModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Self-contained Form with Key for clean state initialization */}
        <DealForm key={editingDeal?.id || 'new-deal'} editingDeal={editingDeal} />
      </div>
    </div>
  );
}
