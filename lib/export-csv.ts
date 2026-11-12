import { Deal } from './types';

export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => 
      row.map(cell => {
        const str = String(cell ?? '');
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportDealsToCSV(deals: Deal[]) {
  const headers = [
    'Deal #',
    'Date',
    'Client Name',
    'Vendor Name',
    'Item Description',
    'Quantity',
    'Unit',
    'Vendor Rate ($)',
    'Transport / Labor Cost ($)',
    'Total Buying Cost ($)',
    'Selling Price ($)',
    'Net Profit ($)',
    'Margin %',
    'Delivery Status',
    'Payment Status',
    'Client Paid ($)',
    'Notes'
  ];

  const rows = deals.map(d => [
    d.dealNumber,
    d.date,
    d.clientName,
    d.vendorName,
    d.itemDescription,
    d.quantity,
    d.unit,
    d.vendorRate,
    d.transportCost,
    d.totalBuyingCost,
    d.sellingPrice,
    d.netProfit,
    d.profitMarginPct,
    d.deliveryStatus,
    d.paymentStatus,
    d.clientPaidAmount || 0,
    d.notes || ''
  ]);

  downloadCSV('My-Supply-Deals', headers, rows);
}
