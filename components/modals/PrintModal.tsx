'use client';

import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Truck, 
  Receipt
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';

export function PrintModal() {
  const { isPrintModalOpen, printingDeal, setPrintModalOpen } = useAppStore();
  const [docType, setDocType] = useState<'INVOICE' | 'CHALLAN'>('INVOICE');

  if (!isPrintModalOpen || !printingDeal) return null;

  const triggerPrint = () => {
    window.print();
  };

  const isInvoice = docType === 'INVOICE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-8 print:m-0 print:p-0 print:border-none print:shadow-none print:w-full">
        {/* Top Control Bar (Hidden when printed) */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between no-print">
          {/* Document Switcher Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
            <button
              onClick={() => setDocType('INVOICE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isInvoice ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-[#5345E6]" />
              <span>Client Bill / Invoice</span>
            </button>

            <button
              onClick={() => setDocType('CHALLAN')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !isInvoice ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-sky-500" />
              <span>Delivery Challan (No Prices)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={triggerPrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#5345E6] hover:bg-[#4335D6] text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={() => setPrintModalOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-8 sm:p-10 text-xs leading-relaxed bg-white text-slate-900 print:p-4">
          {/* Company & Document Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-6">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
                {isInvoice ? 'COMMERCIAL SUPPLY BILL' : 'DELIVERY CHALLAN & GATE PASS'}
              </h1>
              <p className="text-xs font-bold text-[#5345E6] uppercase mt-0.5 tracking-wider">
                COMMERCIAL TRADING & SUPPLY SERVICES
              </p>
              <p className="text-slate-500 text-[11px] mt-1">
                Direct Supplier & Commodity Trading Services • Bangladesh
              </p>
            </div>

            <div className="text-right">
              <div className="text-sm font-extrabold text-slate-900 font-mono">
                {isInvoice ? `INV-${printingDeal.dealNumber}` : `DC-${printingDeal.dealNumber}`}
              </div>
              <div className="text-slate-600 mt-1">Date: {formatDate(printingDeal.date)}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Ref: {printingDeal.dealNumber}</div>
              <div className="mt-2 inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                {isInvoice ? `Payment: ${printingDeal.paymentStatus}` : 'Delivery Gate Pass'}
              </div>
            </div>
          </div>

          {/* Consignee / Client Info */}
          <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                Billed / Supplied To (Client):
              </span>
              <p className="text-sm font-bold text-slate-900">{printingDeal.clientName}</p>
              <p className="text-slate-600 text-[11px] mt-0.5">Commercial Delivery Destination</p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                Supply Dispatch Note:
              </span>
              <p className="text-slate-700 text-[11px]">
                <strong>Delivery Status:</strong> {printingDeal.deliveryStatus}
              </p>
              {printingDeal.notes && (
                <p className="text-slate-600 text-[11px] mt-0.5">
                  <strong>Notes:</strong> {printingDeal.notes}
                </p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left border-collapse border border-slate-300 mb-6">
            <thead>
              <tr className="bg-slate-100 text-slate-900 uppercase font-bold text-[10px] border-b border-slate-300">
                <th className="py-2.5 px-3 border-r border-slate-300 w-12 text-center">#</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Material Description</th>
                <th className="py-2.5 px-3 border-r border-slate-300 w-28 text-right">Quantity</th>
                <th className="py-2.5 px-3 border-r border-slate-300 w-20 text-center">Unit</th>
                {isInvoice && (
                  <>
                    <th className="py-2.5 px-3 border-r border-slate-300 w-28 text-right">Unit Rate (৳)</th>
                    <th className="py-2.5 px-3 w-32 text-right">Total (৳)</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {printingDeal.items && printingDeal.items.length > 0 ? (
                printingDeal.items.map((item, index) => {
                  const lineUnitRate = item.sellingRate || (item.totalSelling ? (item.totalSelling / item.quantity) : (printingDeal.sellingPrice / (printingDeal.quantity || 1)));
                  const lineTotal = item.sellingRate ? (item.sellingRate * item.quantity) : (item.totalSelling || printingDeal.sellingPrice);

                  return (
                    <tr key={item.id || index} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-xs">
                        {index + 1}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 font-semibold text-slate-900">
                        {item.itemDescription}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right font-bold text-slate-900 tabular-nums">
                        {formatNumber(item.quantity)}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center text-slate-600">
                        {item.unit}
                      </td>
                      {isInvoice && (
                        <>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-right tabular-nums text-slate-700">
                            {formatCurrency(lineUnitRate)}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums font-black text-slate-950">
                            {formatCurrency(lineTotal)}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-3 border-r border-slate-200 text-center font-mono">1</td>
                  <td className="py-3 px-3 border-r border-slate-200 font-semibold text-slate-900">
                    {printingDeal.itemDescription}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-200 text-right font-bold text-slate-900 tabular-nums">
                    {formatNumber(printingDeal.quantity)}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-200 text-center text-slate-600">
                    {printingDeal.unit}
                  </td>
                  {isInvoice && (
                    <>
                      <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums text-slate-700">
                        {formatCurrency(printingDeal.sellingPrice / (printingDeal.quantity || 1))}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums font-black text-slate-950">
                        {formatCurrency(printingDeal.sellingPrice)}
                      </td>
                    </>
                  )}
                </tr>
              )}
            </tbody>
          </table>

          {/* Pricing Omission note on Challan */}
          {!isInvoice && (
            <p className="text-[11px] italic text-slate-500 mb-8 p-3 bg-slate-50 rounded-lg border border-slate-200">
              * Note: Pricing is deliberately omitted on this official delivery challan for transport carrier and site warehouse verification.
            </p>
          )}

          {/* Financial Calculation (Only for Invoice) */}
          {isInvoice && (
            <div className="flex justify-end mb-8">
              <div className="w-72 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Bill Subtotal:</span>
                  <span className="font-bold tabular-nums text-slate-900">
                    {formatCurrency(printingDeal.sellingPrice)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Total Paid So Far:</span>
                  <span className="font-bold tabular-nums text-emerald-600">
                    {formatCurrency(printingDeal.clientPaidAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-t-2 border-slate-900 text-sm font-black">
                  <span className="text-slate-950 uppercase">Balance Due:</span>
                  <span className="text-rose-600 tabular-nums">
                    {formatCurrency(Math.max(0, printingDeal.sellingPrice - (printingDeal.clientPaidAmount || 0)))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-12 pt-16 border-t border-slate-300 text-center text-xs">
            <div>
              <div className="border-t border-dashed border-slate-400 pt-2 font-bold text-slate-800">
                Authorized Supplier Signature
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">TraderHub Supply Operations</p>
            </div>
            <div>
              <div className="border-t border-dashed border-slate-400 pt-2 font-bold text-slate-800">
                {isInvoice ? 'Customer Acknowledgment' : 'Received In Full (Client Seal & Sign)'}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Goods received in good condition</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
