# TraderHub • B2B Supplier & Trading Management Platform

A clean, fast, personal **Supplier & Trading Tracker Web App** designed for single-owner B2B businesses that source goods from multiple vendors/mills and supply them to commercial clients.

Tracks the complete trade lifecycle: **Sourcing (Purchase Orders) &rarr; Fulfillment (Delivery Challans & Sales Invoices) &rarr; Financial Settlement (Receivables, Payables, and Net Profit per Order)** in **BDT (৳)**.

---

## Key Features

- **Trading Command Dashboard:**
  - Real-time KPIs: Total Net Profit, Client Receivables, Vendor Payables, and Net Cash in Hand.
  - Weekly Trade Turnover capsule visualization.
  - Priority active dispatch tracker with 1-click printable gate pass.
  - Fulfillment & settlement progress gauge.

- **Supply Deals Tracker:**
  - Log deals with automated profit calculation (`Client Bill - Vendor Cost - Transport Cost = Net Profit & Margin %`).
  - Toggle delivery status (`Pending` &harr; `Delivered`).
  - Track payment status (`Unpaid`, `Partial`, `Settled`).

- **Clients & Vendors Directory:**
  - Save business contacts, phone/WhatsApp numbers, delivery site addresses, and payment terms.
  - Reusable autocomplete dropdowns on deal entry and payment forms.
  - Dual ledgers tracking outstanding receivables and payables per client/supplier.

- **One-Click Printable Documents:**
  - Commercial Supply Bills / Invoices.
  - Delivery Challans & Gate Passes (without prices for drivers/warehouse).

- **Backend Cloud Database & Offline Fallback:**
  - Automated cloud sync with **Supabase PostgreSQL** (`deals`, `saved_parties`, `payments`).
  - Seamless localStorage persistence so the app always works even offline.
  - JSON and CSV spreadsheet backup export & restore.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS + Lucide Icons
- **State Management:** Zustand with local storage persistence + Supabase cloud sync
- **Backend / Database:** Supabase PostgreSQL (`@supabase/supabase-js`)

---

## Deploying on Vercel

1. Import this repository into **[Vercel](https://vercel.com/new)**.
2. In the **Environment Variables** section, add:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://xzxwifdyixxfjlbnjrrv.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `sb_publishable_JnzTpZsMOZntqEL6cZaikQ_bvFN6Trr`
3. Click **Deploy**. Vercel will automatically build and publish your web app.

---

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
