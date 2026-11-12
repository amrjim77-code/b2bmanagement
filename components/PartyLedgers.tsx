'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Building2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CreditCard, 
  Search, 
  Trash2,
  Plus,
  Phone,
  Edit2,
  ShoppingBag
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { PartyType } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export function PartyLedgers() {
  const { 
    deals, 
    payments, 
    deletePayment, 
    setPaymentModalOpen, 
    setDealModalOpen,
    savedParties, 
    setPartyModalOpen 
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<PartyType>('Client');
  const [selectedPartyName, setSelectedPartyName] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // 1. All saved parties for this tab
  const savedForTab = savedParties.filter(p => p.partyType === activeTab);

  // 2. All party names from deals for this tab
  const historicalNames = Array.from(new Set(
    deals.map(d => activeTab === 'Client' ? d.clientName : d.vendorName)
  )).filter(Boolean);

  // 3. Combined unique party names
  const allPartyNames = Array.from(new Set([
    ...savedForTab.map(p => p.name),
    ...historicalNames
  ]));

  // Compute party stats for each combined party
  const partyStats = allPartyNames.map(name => {
    const savedContact = savedForTab.find(
      p => p.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

    if (activeTab === 'Client') {
      const partyDeals = deals.filter(d => d.clientName === name);
      const totalBilled = partyDeals.reduce((s, d) => s + d.sellingPrice, 0);
      const totalPaid = payments
        .filter(p => p.partyType === 'Client' && p.partyName === name)
        .reduce((s, p) => s + p.amount, 0);
      const balanceDue = Math.max(0, totalBilled - totalPaid);

      return {
        name,
        partyType: 'Client' as PartyType,
        savedContact,
        totalBilled,
        totalPaid,
        balanceDue,
        dealsCount: partyDeals.length,
      };
    } else {
      const partyDeals = deals.filter(d => d.vendorName === name);
      const totalBilled = partyDeals.reduce((s, d) => s + d.totalBuyingCost, 0);
      const totalPaid = payments
        .filter(p => p.partyType === 'Vendor' && p.partyName === name)
        .reduce((s, p) => s + p.amount, 0);
      const balanceDue = Math.max(0, totalBilled - totalPaid);

      return {
        name,
        partyType: 'Vendor' as PartyType,
        savedContact,
        totalBilled,
        totalPaid,
        balanceDue,
        dealsCount: partyDeals.length,
      };
    }
  });

  // Filter parties by search query
  const filteredParties = partyStats.filter(p => {
    const q = search.toLowerCase();
    const matchName = p.name.toLowerCase().includes(q);
    const matchPhone = p.savedContact?.phone?.toLowerCase().includes(q);
    const matchPerson = p.savedContact?.contactPerson?.toLowerCase().includes(q);
    const matchAddress = p.savedContact?.address?.toLowerCase().includes(q);
    return matchName || matchPhone || matchPerson || matchAddress;
  });

  // Selected party for detailed history
  const activeParty = selectedPartyName 
    ? partyStats.find(p => p.name === selectedPartyName) || filteredParties[0] 
    : filteredParties[0];

  const partyHistoryDeals = activeParty 
    ? deals.filter(d => activeTab === 'Client' ? d.clientName === activeParty.name : d.vendorName === activeParty.name)
    : [];

  const partyHistoryPayments = activeParty 
    ? payments.filter(p => p.partyType === activeTab && p.partyName === activeParty.name)
    : [];

  // Total balance summary for current tab
  const totalReceivablesForTab = partyStats.reduce((sum, p) => sum + p.balanceDue, 0);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Top Header & Tabs Bar */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/40">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Party Directory & Balance Ledgers
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#5345E6]/10 text-[#5345E6]">
              {partyStats.length} {activeTab === 'Client' ? 'Clients' : 'Vendors'} Saved
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Save client and supplier contact books, credit terms, and live receivable/payable dues in one place.
          </p>
        </div>

        {/* Tab Toggle & Add Contact Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => { setActiveTab('Client'); setSelectedPartyName(null); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'Client'
                  ? 'bg-white text-[#5345E6] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>My Clients ({savedParties.filter(p => p.partyType === 'Client').length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('Vendor'); setSelectedPartyName(null); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'Vendor'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>My Vendors ({savedParties.filter(p => p.partyType === 'Vendor').length})</span>
            </button>
          </div>

          <button
            onClick={() => setPartyModalOpen(true, null, activeTab)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#5345E6] hover:bg-[#4335D6] text-white rounded-2xl text-xs font-bold transition-all shadow-sm shadow-[#5345E6]/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Save New {activeTab}</span>
          </button>
        </div>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
        {/* Left Column: Party List & Search */}
        <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col">
          {/* Search Box & Tab Summary */}
          <div className="p-4 border-b border-slate-100 bg-white space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab.toLowerCase()} by name, phone, address...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-[#5345E6] focus:bg-white font-medium"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] px-1 font-semibold text-slate-500">
              <span>Total {activeTab === 'Client' ? 'Receivable' : 'Payable'} Dues:</span>
              <span className={`font-black tabular-nums ${activeTab === 'Client' ? 'text-amber-600' : 'text-rose-600'}`}>
                {formatCurrency(totalReceivablesForTab)}
              </span>
            </div>
          </div>

          {/* Party List Rows */}
          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-[580px]">
            {filteredParties.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  {activeTab === 'Client' ? <Users className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700">No {activeTab}s Found</h4>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    {search ? 'Try another search term.' : `Save your first ${activeTab.toLowerCase()} so you can reuse them across orders with 1 tap.`}
                  </p>
                </div>
                <button
                  onClick={() => setPartyModalOpen(true, null, activeTab)}
                  className="px-3.5 py-1.5 bg-[#5345E6] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  + Add {activeTab} Now
                </button>
              </div>
            ) : (
              filteredParties.map((party) => {
                const isSelected = activeParty?.name === party.name;
                return (
                  <div
                    key={party.name}
                    onClick={() => setSelectedPartyName(party.name)}
                    className={`p-4 transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected 
                        ? 'bg-[#5345E6]/5 border-l-4 border-l-[#5345E6]' 
                        : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {party.name}
                          </h4>
                          {party.savedContact && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#5345E6]/10 text-[#5345E6]">
                              Saved
                            </span>
                          )}
                        </div>

                        {party.savedContact?.contactPerson && (
                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                            {party.savedContact.contactPerson}
                          </p>
                        )}
                        {party.savedContact?.phone && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {party.savedContact.phone}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-xs font-black tabular-nums block ${
                          party.balanceDue > 0 
                            ? (activeTab === 'Client' ? 'text-amber-600' : 'text-rose-600') 
                            : 'text-emerald-600'
                        }`}>
                          {party.balanceDue > 0 ? formatCurrency(party.balanceDue) : 'Settled ৳0'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {party.balanceDue > 0 ? (activeTab === 'Client' ? 'Due to Collect' : 'Due to Pay') : 'All Paid'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>{party.dealsCount} deal{party.dealsCount !== 1 ? 's' : ''} logged</span>
                      <span>Total: {formatCurrency(party.totalBilled)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Party Profile & Transaction Ledger */}
        <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-6 bg-slate-50/20">
          {activeParty ? (
            <div className="space-y-6">
              {/* Party Profile Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                        {activeParty.name}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {activeTab}
                      </span>
                    </div>

                    {activeParty.savedContact?.contactPerson && (
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Contact: {activeParty.savedContact.contactPerson}
                      </p>
                    )}
                  </div>

                  {/* Actions for this party */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setDealModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-[#5345E6] hover:bg-[#4335D6] text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>+ New Deal</span>
                    </button>

                    <button
                      onClick={() => {
                        if (activeParty.savedContact) {
                          setPartyModalOpen(true, activeParty.savedContact, activeTab);
                        } else {
                          // Quick save this party
                          setPartyModalOpen(true, {
                            id: '',
                            name: activeParty.name,
                            partyType: activeTab,
                            createdAt: '',
                          }, activeTab);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{activeParty.savedContact ? 'Edit Contact' : 'Save Details'}</span>
                    </button>

                    <button
                      onClick={() => setPaymentModalOpen(true, { name: activeParty.name, type: activeTab })}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{activeTab === 'Client' ? '+ Receive Cash' : '+ Pay Supplier'}</span>
                    </button>
                  </div>
                </div>

                {/* Contact Information Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Phone / WhatsApp
                    </span>
                    {activeParty.savedContact?.phone ? (
                      <a 
                        href={`tel:${activeParty.savedContact.phone}`} 
                        className="font-semibold text-[#5345E6] hover:underline flex items-center gap-1 font-mono text-xs"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{activeParty.savedContact.phone}</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Not saved yet</span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Address / Site
                    </span>
                    <span className="font-medium text-slate-700 text-xs truncate block">
                      {activeParty.savedContact?.address || 'Site delivery location not set'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Payment Terms
                    </span>
                    <span className="font-semibold text-slate-800 text-xs">
                      {activeParty.savedContact?.paymentTerms || 'Standard Terms'}
                    </span>
                  </div>
                </div>

                {activeParty.savedContact?.notes && (
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700">Notes / Banking: </span>
                    <span>{activeParty.savedContact.notes}</span>
                  </div>
                )}
              </div>

              {/* Financial KPI Cards for this party */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Total {activeTab === 'Client' ? 'Billed' : 'Procured'}
                  </span>
                  <div className="text-sm sm:text-base font-black text-slate-900 tabular-nums mt-1">
                    {formatCurrency(activeParty.totalBilled)}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Total {activeTab === 'Client' ? 'Collected' : 'Paid Out'}
                  </span>
                  <div className="text-sm sm:text-base font-black text-emerald-600 tabular-nums mt-1">
                    {formatCurrency(activeParty.totalPaid)}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Remaining Due
                  </span>
                  <div className={`text-sm sm:text-base font-black tabular-nums mt-1 ${
                    activeParty.balanceDue > 0 
                      ? (activeTab === 'Client' ? 'text-amber-600' : 'text-rose-600') 
                      : 'text-emerald-600'
                  }`}>
                    {formatCurrency(activeParty.balanceDue)}
                  </div>
                </div>
              </div>

              {/* Transactions Ledger (Payments Recorded) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Payment History ({partyHistoryPayments.length})
                  </h4>
                </div>

                {partyHistoryPayments.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center border border-slate-100 text-xs text-slate-400 font-medium">
                    No payment receipts logged for {activeParty.name} yet.
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100 shadow-2xs">
                    {partyHistoryPayments.map((payment) => (
                      <div key={payment.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/60 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            activeTab === 'Client' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {activeTab === 'Client' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">
                              {formatCurrency(payment.amount)} via {payment.paymentMethod}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {formatDate(payment.date)} {payment.reference ? `• Ref: ${payment.reference}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {payment.notes && (
                            <span className="text-[11px] text-slate-500 italic max-w-xs truncate hidden sm:inline">
                              {payment.notes}
                            </span>
                          )}
                          <button
                            onClick={() => {
                              if (confirm('Delete this payment record? Associated deals will revert their paid amounts.')) {
                                deletePayment(payment.id);
                              }
                            }}
                            className="p-1 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Deals List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Associated Supply Deals ({partyHistoryDeals.length})
                  </h4>
                </div>

                {partyHistoryDeals.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center border border-slate-100 text-xs text-slate-400 font-medium">
                    No deals logged with this party yet.
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100 shadow-2xs">
                    {partyHistoryDeals.map((deal) => (
                      <div key={deal.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/60 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-700 text-[11px]">
                              {deal.dealNumber}
                            </span>
                            <span className="font-bold text-slate-900">
                              {deal.itemDescription}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                              deal.deliveryStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {deal.deliveryStatus}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 mt-0.5 block">
                            {formatDate(deal.date)} • {deal.quantity} {deal.unit}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-slate-900 tabular-nums block">
                            {formatCurrency(deal.sellingPrice)}
                          </span>
                          <span className={`text-[10px] font-bold ${
                            deal.paymentStatus === 'Settled' ? 'text-emerald-600' : 'text-amber-600'
                          }`}>
                            {deal.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-12 text-center text-slate-400">
              Select a party from the left to view contact details, dues, and transaction ledgers.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
