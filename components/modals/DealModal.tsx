'use client';

import React, { useState } from 'react';
import { X, TrendingUp, PlusCircle, Check, Trash2, Plus, Package } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Deal, DeliveryStatus, SavedParty, DealItem } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface DealFormProps {
  editingDeal: Deal | null;
}

interface FormLineItem {
  id: string;
  itemDescription: string;
  quantity: number;
  unit: string;
  vendorRate: number;  // buying rate per unit
  sellingRate: number; // selling rate per unit
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

  // Multiple Line Items State
  const initialLineItems: FormLineItem[] = React.useMemo(() => {
    if (editingDeal?.items && editingDeal.items.length > 0) {
      return editingDeal.items.map((it, idx) => ({
        id: it.id || `item-${idx + 1}-${Date.now()}`,
        itemDescription: it.itemDescription || '',
        quantity: it.quantity || 1,
        unit: it.unit || 'ton',
        vendorRate: it.vendorRate || 0,
        sellingRate: it.sellingRate || (it.quantity > 0 ? (editingDeal.sellingPrice / editingDeal.quantity) : 0),
      }));
    }
    return [{
      id: `item-1-${Date.now()}`,
      itemDescription: editingDeal?.itemDescription || '',
      quantity: editingDeal?.quantity || 1,
      unit: editingDeal?.unit || 'ton',
      vendorRate: editingDeal?.vendorRate || 0,
      sellingRate: editingDeal ? (editingDeal.quantity > 0 ? (editingDeal.sellingPrice / editingDeal.quantity) : 0) : 0,
    }];
  }, [editingDeal]);

  const [lineItems, setLineItems] = useState<FormLineItem[]>(initialLineItems);
  const [focusedItemIndex, setFocusedItemIndex] = useState<number>(0);
  const [transportCost, setTransportCost] = useState(editingDeal?.transportCost || 0);
  
  // Custom or auto selling price
  const [customSellingPrice, setCustomSellingPrice] = useState<number | null>(
    editingDeal ? editingDeal.sellingPrice : null
  );
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>(editingDeal?.deliveryStatus || 'Pending');
  const [notes, setNotes] = useState(editingDeal?.notes || '');

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

  // Line Item Operations
  const updateLineItem = (index: number, field: keyof FormLineItem, value: any) => {
    setLineItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addLineItem = () => {
    setLineItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        itemDescription: '',
        quantity: 1,
        unit: prev[prev.length - 1]?.unit || 'ton',
        vendorRate: 0,
        sellingRate: 0,
      }
    ]);
    setFocusedItemIndex(lineItems.length);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(prev => prev.filter((_, i) => i !== index));
    if (focusedItemIndex >= lineItems.length - 1) {
      setFocusedItemIndex(Math.max(0, lineItems.length - 2));
    }
  };

  const handleSelectSavedItem = (item: string) => {
    const targetIdx = focusedItemIndex < lineItems.length ? focusedItemIndex : 0;
    const prior = deals.find(d => d.itemDescription?.trim().toLowerCase() === item.toLowerCase());
    
    setLineItems(prev => {
      const next = [...prev];
      next[targetIdx] = {
        ...next[targetIdx],
        itemDescription: item,
        unit: prior?.unit || next[targetIdx].unit,
        vendorRate: prior?.vendorRate && next[targetIdx].vendorRate === 0 ? prior.vendorRate : next[targetIdx].vendorRate,
      };
      return next;
    });
  };

  // Calculations across multiple line items
  const totalGoodsCost = lineItems.reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.vendorRate || 0)), 0);
  const totalBuyingCost = totalGoodsCost + transportCost;
  const calculatedSellingTotal = lineItems.reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.sellingRate || 0)), 0);

  const effectiveSellingPrice = customSellingPrice !== null ? customSellingPrice : calculatedSellingTotal;
  const netProfit = effectiveSellingPrice - totalBuyingCost;
  const profitMarginPct = effectiveSellingPrice > 0 ? (netProfit / effectiveSellingPrice) * 100 : 0;
  const totalQuantity = lineItems.reduce((acc, it) => acc + Number(it.quantity || 0), 0);
  const mainUnit = lineItems[0]?.unit || 'ton';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dealItems: DealItem[] = lineItems.map(it => ({
      id: it.id,
      itemDescription: it.itemDescription.trim() || 'General Goods',
      quantity: Number(it.quantity || 1),
      unit: it.unit || 'ton',
      vendorRate: Number(it.vendorRate || 0),
      sellingRate: Number(it.sellingRate || 0),
      totalCost: Number(it.quantity || 1) * Number(it.vendorRate || 0),
      totalSelling: Number(it.quantity || 1) * Number(it.sellingRate || 0),
    }));

    const summaryItemDescription = dealItems.length === 1
      ? dealItems[0].itemDescription
      : dealItems.map(i => `${i.itemDescription} (${i.quantity} ${i.unit})`).join(', ');

    const payload = {
      date,
      clientName,
      vendorName,
      itemDescription: summaryItemDescription,
      quantity: totalQuantity,
      unit: mainUnit,
      items: dealItems,
      vendorRate: dealItems.length === 1 ? dealItems[0].vendorRate : (totalGoodsCost / (totalQuantity || 1)),
      transportCost,
      totalBuyingCost,
      sellingPrice: effectiveSellingPrice,
      netProfit,
      profitMarginPct: Number(profitMarginPct.toFixed(2)),
      deliveryStatus,
      notes,
    };

    if (editingDeal) {
      updateDeal(editingDeal.id, payload);
    } else {
      addDeal(payload);
    }

    setDealModalOpen(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {/* Date & Parties Row */}
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

        {/* Client Name with Reusable Autocomplete */}
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
              Auto-saves to directory on submit
            </span>
          ) : null}
        </div>

        {/* Vendor Name with Reusable Autocomplete */}
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
              Auto-saves to directory on submit
            </span>
          ) : null}
        </div>
      </div>

      {/* MULTIPLE LINE ITEMS SECTION */}
      <div className="space-y-3 pt-1 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#5345E6]" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Supply Items & Commodities ({lineItems.length})
            </h4>
          </div>
          <button
            type="button"
            onClick={addLineItem}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#5345E6]/10 hover:bg-[#5345E6] text-[#5345E6] hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Another Item</span>
          </button>
        </div>

        {/* Global Datalist for saved items */}
        <datalist id="saved-items-datalist">
          {availableItems.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>

        {/* Line Items Container */}
        <div className="space-y-3">
          {lineItems.map((item, index) => {
            const rowBuyCost = (Number(item.quantity) || 0) * (Number(item.vendorRate) || 0);
            const rowSellCost = (Number(item.quantity) || 0) * (Number(item.sellingRate) || 0);
            const rowProfit = rowSellCost - rowBuyCost;

            return (
              <div
                key={item.id}
                onClick={() => setFocusedItemIndex(index)}
                className={`p-3.5 rounded-2xl border transition-all ${
                  focusedItemIndex === index
                    ? 'border-[#5345E6]/50 bg-white shadow-xs ring-1 ring-[#5345E6]/20'
                    : 'border-slate-200/80 bg-slate-50/70 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#5345E6] text-white flex items-center justify-center text-[10px] font-black">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      Item #{index + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Row subtotal badges */}
                    <div className="hidden sm:flex items-center gap-3 text-[11px] font-medium text-slate-500">
                      <span>Buy: <strong className="text-slate-800">{formatCurrency(rowBuyCost)}</strong></span>
                      <span>•</span>
                      <span>Sell: <strong className="text-slate-800">{formatCurrency(rowSellCost)}</strong></span>
                      <span>•</span>
                      <span className={rowProfit >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                        {rowProfit >= 0 ? '+' : ''}{formatCurrency(rowProfit)}
                      </span>
                    </div>

                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLineItem(index);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  {/* Item Description */}
                  <div className="sm:col-span-5">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Commodity / Description *
                    </label>
                    <input
                      type="text"
                      list="saved-items-datalist"
                      placeholder="e.g. 500W Deformed Rebar (16mm)"
                      value={item.itemDescription}
                      onFocus={() => setFocusedItemIndex(index)}
                      onChange={(e) => updateLineItem(index, 'itemDescription', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] font-medium"
                      required
                    />
                  </div>

                  {/* Quantity */}
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      value={item.quantity}
                      onFocus={() => setFocusedItemIndex(index)}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] tabular-nums font-bold"
                      required
                    />
                  </div>

                  {/* Unit */}
                  <div className="sm:col-span-1">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Unit
                    </label>
                    <select
                      value={item.unit}
                      onFocus={() => setFocusedItemIndex(index)}
                      onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] font-medium"
                    >
                      <option value="ton">Ton</option>
                      <option value="kg">Kg</option>
                      <option value="pcs">Pcs</option>
                      <option value="bag">Bag</option>
                      <option value="carton">Carton</option>
                      <option value="cft">CFT</option>
                      <option value="bundle">Bundle</option>
                      <option value="meter">Meter</option>
                    </select>
                  </div>

                  {/* Buying Rate */}
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Buy Rate (৳)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={item.vendorRate || ''}
                      onFocus={() => setFocusedItemIndex(index)}
                      onChange={(e) => updateLineItem(index, 'vendorRate', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] tabular-nums font-semibold"
                      required
                    />
                  </div>

                  {/* Selling Rate */}
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Sell Rate (৳)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={item.sellingRate || ''}
                      onFocus={() => {
                        setFocusedItemIndex(index);
                        setCustomSellingPrice(null); // allow auto-calc
                      }}
                      onChange={(e) => {
                        updateLineItem(index, 'sellingRate', parseFloat(e.target.value) || 0);
                        setCustomSellingPrice(null);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] tabular-nums font-semibold"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Clickable Saved Item Pills for the active item row */}
        {availableItems.length > 0 && (
          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/60 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Quick Fill for Item #{focusedItemIndex + 1} (Click to set):</span>
              <span>{availableItems.length} saved commodities</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-0.5">
              {availableItems.map((savedItem) => {
                const currentItemName = lineItems[focusedItemIndex]?.itemDescription || '';
                const isSelected = currentItemName.trim().toLowerCase() === savedItem.toLowerCase();
                return (
                  <div
                    key={savedItem}
                    className={`inline-flex items-center rounded-lg text-[11px] transition-all border ${
                      isSelected
                        ? 'bg-[#5345E6] text-white border-[#5345E6] shadow-2xs font-bold'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-[#5345E6]/40 font-medium'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectSavedItem(savedItem)}
                      className="px-2.5 py-1 text-left cursor-pointer flex items-center gap-1"
                      title={`Click to fill "${savedItem}" into Item #${focusedItemIndex + 1}`}
                    >
                      <span className="text-[10px]">📦</span>
                      <span>{savedItem}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSavedItem(savedItem);
                      }}
                      className={`pr-1.5 pl-0.5 hover:text-red-500 opacity-60 hover:opacity-100 cursor-pointer text-xs leading-none ${
                        isSelected ? 'text-white/80 hover:text-white' : 'text-slate-400'
                      }`}
                      title={`Remove "${savedItem}" from catalog`}
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* FINANCIAL & MARGIN BREAKDOWN GRID */}
      <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
          Financial & Margin Breakdown (BDT ৳)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Total Goods Cost */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Goods Buying Cost (Sum)
            </label>
            <div className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 tabular-nums font-bold">
              {formatCurrency(totalGoodsCost)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Sum of {lineItems.length} item{lineItems.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Transport / Truck Freight */}
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
              Combined shipment freight
            </span>
          </div>

          {/* Selling Price */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800">
                Total Selling (Client Bill ৳) *
              </label>
              {customSellingPrice !== null && (
                <button
                  type="button"
                  onClick={() => setCustomSellingPrice(null)}
                  className="text-[10px] text-[#5345E6] font-bold hover:underline"
                >
                  Reset to items sum
                </button>
              )}
            </div>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={effectiveSellingPrice || ''}
              onChange={(e) => setCustomSellingPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border-2 border-[#5345E6]/40 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-[#5345E6] tabular-nums font-bold"
              required
            />
            <span className="text-[10px] text-[#5345E6] font-semibold mt-0.5 block">
              Total Invoiced to Client
            </span>
          </div>
        </div>

        {/* Live Net Profit Summary Banner */}
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
          <label className="text-xs font-bold text-slate-700 block mb-1">Internal Notes</label>
          <input
            type="text"
            placeholder="e.g. LC reference, truck plate no, warehouse slip..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] focus:bg-white font-medium"
          />
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
        <button
          type="button"
          onClick={() => setDealModalOpen(false)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[#5345E6] hover:bg-[#4335D6] text-white text-xs font-bold transition-all shadow-sm shadow-[#5345E6]/25 cursor-pointer"
        >
          {editingDeal ? 'Update Supply Deal' : 'Save Supply Deal'}
        </button>
      </div>
    </form>
  );
}

export function DealModal() {
  const { isDealModalOpen, setDealModalOpen, editingDeal } = useAppStore();

  if (!isDealModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{editingDeal ? 'Edit Supply Deal' : 'Log New Supply Deal'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-[#5345E6] font-bold">
                {editingDeal ? editingDeal.dealNumber : 'Multi-Item Order'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Add single or multiple commodities, calculate margins, and manage logistics.
            </p>
          </div>
          <button
            onClick={() => setDealModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <DealForm editingDeal={editingDeal} />
      </div>
    </div>
  );
}
