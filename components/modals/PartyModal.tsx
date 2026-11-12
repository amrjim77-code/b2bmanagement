'use client';

import React, { useState } from 'react';
import { X, Building2, User, Trash2, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { PartyType, SavedParty } from '@/lib/types';

interface PartyFormProps {
  editingParty: SavedParty | null;
  defaultType: PartyType;
}

function PartyForm({ editingParty, defaultType }: PartyFormProps) {
  const { 
    setPartyModalOpen, 
    addSavedParty, 
    updateSavedParty, 
    deleteSavedParty 
  } = useAppStore();

  const [partyType, setPartyType] = useState<PartyType>(editingParty ? editingParty.partyType : defaultType);
  const [name, setName] = useState(editingParty?.name || '');
  const [contactPerson, setContactPerson] = useState(editingParty?.contactPerson || '');
  const [phone, setPhone] = useState(editingParty?.phone || '');
  const [address, setAddress] = useState(editingParty?.address || '');
  const [paymentTerms, setPaymentTerms] = useState(editingParty?.paymentTerms || 'Cash on Delivery');
  const [notes, setNotes] = useState(editingParty?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    if (editingParty) {
      updateSavedParty(editingParty.id, {
        name: cleanName,
        partyType,
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        paymentTerms: paymentTerms.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addSavedParty({
        name: cleanName,
        partyType,
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        paymentTerms: paymentTerms.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }

    setPartyModalOpen(false);
  };

  const commonTerms = [
    'Cash on Delivery',
    'Net 15 Days',
    'Net 30 Days',
    '50% Advance + 50% Delivery',
    '100% Advance (Bank EFT)',
    'bKash / Nagad Instant'
  ];

  return (
    <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
      {/* Party Type Switcher (only for new party) */}
      {!editingParty && (
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">Party Type</label>
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setPartyType('Client')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                partyType === 'Client'
                  ? 'bg-white text-[#5345E6] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Client / Buyer</span>
            </button>
            <button
              type="button"
              onClick={() => setPartyType('Vendor')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                partyType === 'Vendor'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Vendor / Mill Supplier</span>
            </button>
          </div>
        </div>
      )}

      {/* Party Name */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1">
          {partyType === 'Client' ? 'Client / Business Name' : 'Vendor / Supplier / Mill Name'} *
        </label>
        <div className="relative">
          <input
            type="text"
            required
            placeholder={partyType === 'Client' ? 'e.g. Metro Builders & Infra Ltd' : 'e.g. Apex Steel Mills Ltd'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] focus:bg-white font-semibold placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Contact Person & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Contact Person / Title
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Engr. Rafiqul (Procurement)"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] focus:bg-white font-medium placeholder:text-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Phone / WhatsApp Number
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. +880 1711-234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] focus:bg-white font-medium placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Address / Delivery Site */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1">
          Address / Site / Warehouse Location
        </label>
        <input
          type="text"
          placeholder="e.g. Plot 42, Road 11, Banani, Dhaka / Mirpur Site"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] focus:bg-white font-medium placeholder:text-slate-400"
        />
      </div>

      {/* Payment Terms */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1">
          Default Credit / Payment Terms
        </label>
        <input
          type="text"
          placeholder="e.g. Net 15 Days, Cash on Delivery, 50% Advance"
          value={paymentTerms}
          onChange={(e) => setPaymentTerms(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] focus:bg-white font-medium placeholder:text-slate-400 mb-2"
        />
        
        {/* Quick chips for payment terms */}
        <div className="flex flex-wrap gap-1.5">
          {commonTerms.map((term) => (
            <button
              type="button"
              key={term}
              onClick={() => setPaymentTerms(term)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                paymentTerms === term
                  ? 'bg-[#5345E6]/10 text-[#5345E6] border-[#5345E6]/30 font-bold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Notes or Bank / MFS details */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1">
          Notes / Bank / bKash Account
        </label>
        <textarea
          rows={2}
          placeholder="e.g. bKash Merchant: 017..., Bank A/C: City Bank 110293..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#5345E6] focus:bg-white font-medium placeholder:text-slate-400 resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        {editingParty ? (
          <button
            type="button"
            onClick={() => {
              if (confirm(`Are you sure you want to delete ${editingParty.name} from saved contacts? Existing deals will keep their record.`)) {
                deleteSavedParty(editingParty.id);
                setPartyModalOpen(false);
              }
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Contact</span>
          </button>
        ) : <div />}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPartyModalOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#5345E6] hover:bg-[#4335D6] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#5345E6]/25 cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{editingParty ? 'Save Changes' : `Save ${partyType}`}</span>
          </button>
        </div>
      </div>
    </form>
  );
}

export function PartyModal() {
  const { 
    isPartyModalOpen, 
    editingParty, 
    partyModalDefaultType, 
    setPartyModalOpen 
  } = useAppStore();

  if (!isPartyModalOpen) return null;

  const currentType = editingParty ? editingParty.partyType : (partyModalDefaultType || 'Client');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              currentType === 'Client' ? 'bg-[#5345E6]/10 text-[#5345E6]' : 'bg-amber-100 text-amber-700'
            }`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {editingParty 
                  ? `Edit ${currentType}: ${editingParty.name}` 
                  : `Save New ${currentType === 'Client' ? 'Client (Buyer)' : 'Vendor (Supplier)'}`
                }
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Save contact and credit terms to reuse across orders and invoices anytime.
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setPartyModalOpen(false)}
            className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Self-contained Form with Key for clean state initialization */}
        <PartyForm 
          key={editingParty ? `edit-${editingParty.id}` : `new-${partyModalDefaultType || 'Client'}`}
          editingParty={editingParty}
          defaultType={partyModalDefaultType || 'Client'}
        />
      </div>
    </div>
  );
}
