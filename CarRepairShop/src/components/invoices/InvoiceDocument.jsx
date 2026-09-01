import React, { useState } from 'react'
import {
  Printer,
  Receipt,
  Car,
  User,
  Phone,
  EnvelopeSimple,
  MapPin,
  Gauge,
  Package,
  Wrench,
  CheckCircle,
  Clock,
  QrCode,
  Check,
  Copy,
  CreditCard,
  ShieldCheck,
} from '@phosphor-icons/react'

export default function InvoiceDocument({ invoice, onRecordPayment, onClose }) {
  const [copiedVin, setCopiedVin] = useState(false)

  if (!invoice) return null

  const handleCopyVin = (vin) => {
    if (!vin) return
    navigator.clipboard.writeText(vin)
    setCopiedVin(true)
    setTimeout(() => setCopiedVin(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  // Financial calculations
  const totalAmount = parseFloat(invoice.amount || 0)
  const paidAmount = parseFloat(invoice.paidAmount || 0)
  const balanceDue = invoice.balanceDue !== undefined && invoice.balanceDue !== null 
    ? parseFloat(invoice.balanceDue) 
    : Math.max(0, totalAmount - paidAmount)
  const isPaid = invoice.status === 'Paid' || balanceDue === 0

  // Calculate parts vs labor breakdown
  const partsList = Array.isArray(invoice.partsUsed) ? invoice.partsUsed : []
  const partsSubtotal = partsList.reduce((sum, p) => {
    const itemTotal = parseFloat(p.totalPrice || (p.quantity * p.unitPrice) || 0)
    return sum + itemTotal
  }, 0)

  // Estimated labor if not explicitly separated
  const rawLabor = totalAmount > partsSubtotal ? totalAmount - partsSubtotal : Math.max(0, totalAmount * 0.45)
  const laborSubtotal = parseFloat(rawLabor.toFixed(2))
  const calculatedSubtotal = parseFloat((partsSubtotal + laborSubtotal).toFixed(2))

  return (
    <div className="space-y-4">
      {/* Printable Paper Canvas */}
      <div
        id="printable-invoice"
        className="printable-invoice-container bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8 font-sans transition-colors"
      >
        {/* 1. Header Section: Workshop Identity & Invoice Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-800">
          <div className="space-y-1 max-w-md">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Wrench size={22} weight="bold" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
                  AUTOCARE PRO GARAGE
                </h1>
                <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
                  Certified Automotive Diagnostics & Repair Center
                </p>
              </div>
            </div>
            <div className="pt-2 text-[11px] text-slate-600 space-y-0.5 leading-relaxed">
              <p className="flex items-center gap-1.5">
                <MapPin size={13} className="text-slate-500 flex-shrink-0" />
                4582 Industrial Parkway, Suite 100, Motor City, MI 48201
              </p>
              <p className="flex items-center gap-1.5">
                <Phone size={13} className="text-slate-500 flex-shrink-0" />
                +1 (555) 019-4820 &nbsp;·&nbsp; service@protech-autorepair.com
              </p>
              <p className="font-mono text-[10px] text-slate-500 font-semibold">
                TAX ID / EIN: 89-2199402 &nbsp;·&nbsp; Workshop License: #AG-774092
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-2 flex flex-col items-start sm:items-end">
            <div className="inline-block">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                TAX INVOICE
              </h2>
              <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                OFFICIAL WORKSHOP RECEIPT
              </p>
            </div>

            {/* Official Status Stamp */}
            <div className="pt-1">
              {isPaid ? (
                <div className="inline-flex flex-col items-center sm:items-end px-3 py-1.5 rounded-xl border-2 border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm">
                  <div className="flex items-center gap-1 font-black text-xs uppercase tracking-widest text-emerald-700">
                    <CheckCircle size={15} weight="fill" className="text-emerald-600" />
                    PAID IN FULL
                  </div>
                  <span className="text-[9px] font-mono text-emerald-700 font-semibold">
                    {invoice.paymentMethod || 'Credit Card'} · {invoice.issueDate}
                  </span>
                </div>
              ) : invoice.status === 'Partially Paid' ? (
                <div className="inline-flex flex-col items-center sm:items-end px-3 py-1.5 rounded-xl border-2 border-sky-600 bg-sky-50 text-sky-800 shadow-sm">
                  <div className="flex items-center gap-1 font-black text-xs uppercase tracking-widest text-sky-700">
                    <Clock size={15} weight="fill" className="text-sky-600" />
                    PARTIALLY PAID
                  </div>
                  <span className="text-[9px] font-mono text-sky-700 font-semibold">
                    Paid: ${paidAmount.toFixed(2)} · Due: ${balanceDue.toFixed(2)}
                  </span>
                </div>
              ) : invoice.status === 'Overdue' ? (
                <div className="inline-flex flex-col items-center sm:items-end px-3 py-1.5 rounded-xl border-2 border-rose-600 bg-rose-50 text-rose-800 shadow-sm">
                  <div className="flex items-center gap-1 font-black text-xs uppercase tracking-widest text-rose-700">
                    OVERDUE
                  </div>
                  <span className="text-[9px] font-mono text-rose-700 font-semibold">
                    Payment Required
                  </span>
                </div>
              ) : (
                <div className="inline-flex flex-col items-center sm:items-end px-3 py-1.5 rounded-xl border-2 border-amber-600 bg-amber-50 text-amber-800 shadow-sm">
                  <div className="flex items-center gap-1 font-black text-xs uppercase tracking-widest text-amber-700">
                    PAYMENT DUE
                  </div>
                  <span className="text-[9px] font-mono text-amber-700 font-semibold">
                    Net 7 Days
                  </span>
                </div>
              )}
            </div>

            {/* Metadata Summary */}
            <div className="text-[11px] font-mono text-slate-700 space-y-0.5 pt-1">
              <p>
                <span className="text-slate-500 font-sans font-medium">Invoice No:</span>{' '}
                <strong className="text-slate-900 font-bold text-xs">{invoice.invoiceNumber}</strong>
              </p>
              <p>
                <span className="text-slate-500 font-sans font-medium">Issue Date:</span>{' '}
                <strong className="text-slate-900">{invoice.issueDate}</strong>
              </p>
              <p>
                <span className="text-slate-500 font-sans font-medium">Payment Due:</span>{' '}
                <strong className="text-slate-900">{invoice.dueDate}</strong>
              </p>
              <p>
                <span className="text-slate-500 font-sans font-medium">Work Order Ref:</span>{' '}
                <strong className="text-emerald-700 font-bold">{invoice.orderNumber}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* 2. Customer & Vehicle 2-Column Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-5 border-b border-slate-200 text-xs">
          {/* Bill To Customer */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <User size={13} className="text-slate-700" weight="bold" />
              BILL TO (CUSTOMER)
            </p>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm text-slate-900">{invoice.customer}</p>
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                  {invoice.customerCode || 'CUST-001'}
                </span>
              </div>
              {invoice.customerPhone && (
                <p className="text-slate-600 flex items-center gap-1.5 text-[11px]">
                  <Phone size={12} className="text-slate-400" /> {invoice.customerPhone}
                </p>
              )}
              {invoice.customerEmail && (
                <p className="text-slate-600 flex items-center gap-1.5 text-[11px]">
                  <EnvelopeSimple size={12} className="text-slate-400" /> {invoice.customerEmail}
                </p>
              )}
              {invoice.customerAddress && (
                <p className="text-slate-600 flex items-center gap-1.5 text-[11px]">
                  <MapPin size={12} className="text-slate-400" /> {invoice.customerAddress}
                </p>
              )}
            </div>
          </div>

          {/* Vehicle Serviced */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Car size={13} className="text-slate-700" weight="bold" />
              VEHICLE SERVICED (SERVICE UNIT)
            </p>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm text-slate-900">
                  {invoice.vehicle || `${invoice.vehicleBrand || ''} ${invoice.vehicleModel || ''}`.trim() || 'Vehicle'}
                </p>
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {invoice.vehiclePlate || '—'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-slate-600">
                <p>
                  <span className="text-slate-400">Year/Color:</span> {invoice.vehicleYear || '2022'} · {invoice.vehicleColor || 'Standard'}
                </p>
                <p>
                  <span className="text-slate-400">Odometer:</span>{' '}
                  <strong className="font-mono text-slate-900 font-semibold">{invoice.odometer || '34,500'} km</strong>
                </p>
                <div className="col-span-2 flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                  <span className="text-slate-400 font-sans">VIN:</span>
                  <span className="font-semibold text-slate-700">{invoice.vehicleVin || '1HGCR2F83HA001234'}</span>
                  {invoice.vehicleVin && (
                    <button
                      onClick={() => handleCopyVin(invoice.vehicleVin)}
                      className="text-slate-400 hover:text-slate-800 cursor-pointer no-print"
                      title="Copy VIN"
                    >
                      {copiedVin ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                    </button>
                  )}
                </div>
                <p className="col-span-2 pt-0.5 text-[10px] text-slate-500">
                  <span className="text-slate-400">Lead Technician:</span> <strong>{invoice.mechanic || 'Jordan Hayes'}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Service Scope & Diagnostic Findings */}
        <div className="py-3 border-b border-slate-200 text-xs space-y-1.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            SERVICE SCOPE & DIAGNOSTIC FINDINGS
          </p>
          <div className="p-2.5 rounded-lg bg-slate-100/70 border border-slate-200/80 space-y-1 text-[11px]">
            <p className="text-slate-800">
              <strong className="font-semibold text-slate-900">Customer Request / Concern:</strong>{' '}
              {invoice.problem || 'Routine scheduled vehicle service & multi-point diagnostics'}
            </p>
            {invoice.diagnosis && (
              <p className="text-slate-700">
                <strong className="font-semibold text-slate-900">Diagnostic Notes & Work Performed:</strong>{' '}
                {invoice.diagnosis}
              </p>
            )}
          </div>
        </div>

        {/* 4. Itemized Parts, Labor & Services Table */}
        <div className="py-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              ITEMIZED BILLING STATEMENT
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Cur: USD ($)</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-8 text-center">#</th>
                  <th className="py-2.5 px-3">Item Description & Specifications</th>
                  <th className="py-2.5 px-3 w-28">Category</th>
                  <th className="py-2.5 px-3 w-16 text-center">Qty / Hrs</th>
                  <th className="py-2.5 px-3 w-24 text-right">Unit Rate</th>
                  <th className="py-2.5 px-3 w-28 text-right">Total ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 text-[11px]">
                {/* 1. Labor / Service Line Item */}
                <tr className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono">1</td>
                  <td className="py-2.5 px-3">
                    <p className="font-bold text-slate-900">
                      {invoice.problem ? `Diagnostic Scan & Service: ${invoice.problem}` : 'Master Technician Diagnostics & Mechanical Service'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Full multi-point system inspection, computerized sensor check & road calibration
                    </p>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-emerald-700">LABOR & SERVICE</td>
                  <td className="py-2.5 px-3 text-center font-mono">1.5 hrs</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    ${(laborSubtotal / 1.5).toFixed(2)}/hr
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    ${laborSubtotal.toFixed(2)}
                  </td>
                </tr>

                {/* 2. Replaced Spare Parts Line Items */}
                {partsList.length > 0 ? (
                  partsList.map((p, idx) => {
                    const partQty = parseInt(p.quantity, 10) || 1
                    const unitP = parseFloat(p.unitPrice) || 0
                    const totalP = parseFloat(p.totalPrice || (partQty * unitP)) || 0

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 2}</td>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="text-[10px] font-mono text-slate-500">SKU / Code: {p.partCode || 'OEM-PART'}</p>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-amber-700">SPARE PART</td>
                        <td className="py-2.5 px-3 text-center font-mono">{partQty}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">${unitP.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ${totalP.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">2</td>
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-slate-900">Standard Workshop Supplies, Consumables & Environmental Disposal</p>
                      <p className="text-[10px] text-slate-500">Shop supplies, solvent cleaners, diagnostic hardware usage</p>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-600">SUPPLIES</td>
                    <td className="py-2.5 px-3 text-center font-mono">1</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">Included</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">$0.00</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Settlement / KHQR Box & Financial Summary Totals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 pb-6 border-b border-slate-200">
          {/* Left: Payment Method & KHQR Scan */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <CreditCard size={13} className="text-slate-700" />
                PAYMENT SETTLEMENT DETAILS
              </p>
              <div className="text-[11px] text-slate-700 space-y-0.5">
                <p>
                  <span className="text-slate-500">Payment Method:</span>{' '}
                  <strong className="text-slate-900 font-semibold">{invoice.paymentMethod || (isPaid ? 'Credit/Debit Card' : 'Pending')}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Payment Status:</span>{' '}
                  <strong className={isPaid ? 'text-emerald-700' : 'text-amber-700'}>
                    {isPaid ? 'Settled (Zero Balance)' : `Pending Settlement ($${balanceDue.toFixed(2)})`}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Reference:</span>{' '}
                  <span className="font-mono text-slate-600">{invoice.payments?.[0]?.paymentNumber || `PAY-${invoice.invoiceNumber}`}</span>
                </p>
              </div>
            </div>

            {/* If Balance Due, Show Instant KHQR Code */}
            {!isPaid && (
              <div className="pt-2 border-t border-slate-200 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-slate-300 shadow-sm flex flex-col items-center flex-shrink-0">
                  <QrCode size={44} className="text-rose-600" weight="bold" />
                  <span className="text-[8px] font-mono font-bold text-slate-700 mt-0.5">KHQR PAY</span>
                </div>
                <div className="text-[10px] text-slate-600">
                  <p className="font-bold text-rose-700 uppercase">Bakong Universal KHQR</p>
                  <p>Scan with any mobile banking app (ABA, Wing, ACLEDA) to pay balance.</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Financial Summary Totals */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 py-0.5">
              <span>Labor & Services Subtotal:</span>
              <span className="font-mono font-semibold text-slate-900">${laborSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 py-0.5">
              <span>Parts & Materials Subtotal:</span>
              <span className="font-mono font-semibold text-slate-900">${partsSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 py-0.5">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold text-slate-900">${calculatedSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 py-0.5">
              <span>Sales Tax / VAT (Standard Included):</span>
              <span className="font-mono font-semibold text-slate-900">$0.00</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 py-0.5">
              <span>Promotional Discount:</span>
              <span className="font-mono font-semibold text-slate-900">-$0.00</span>
            </div>

            <div className="flex items-center justify-between text-base font-black text-slate-900 pt-2 border-t-2 border-slate-900">
              <span>GRAND TOTAL:</span>
              <span className="font-mono text-lg text-slate-900">${totalAmount.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 py-0.5">
              <span>Amount Paid to Date:</span>
              <span className="font-mono font-bold">${paidAmount.toFixed(2)}</span>
            </div>

            <div className={`flex items-center justify-between text-sm font-bold p-2 rounded-lg ${
              isPaid ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              <span>BALANCE DUE:</span>
              <span className="font-mono text-base font-black">${balanceDue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* 6. Legal Terms, Warranty & Signature Block */}
        <div className="pt-4 space-y-4 text-[10px] text-slate-600">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <p className="font-bold text-slate-800 flex items-center gap-1 uppercase tracking-wider text-[10px]">
              <ShieldCheck size={13} className="text-emerald-700" weight="bold" />
              GARAGE WARRANTY & SERVICE POLICY
            </p>
            <p className="leading-relaxed text-slate-600">
              All mechanical repairs, diagnostic services, and OEM replacement parts are covered by our standard{' '}
              <strong>6-Month or 10,000 km workshop warranty</strong>, whichever occurs first. Warranty does not cover normal wear, tear, or customer misuse.
            </p>
          </div>

          {/* Dual Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="space-y-6">
              <p className="font-semibold text-slate-700">Customer Authorization & Acceptance:</p>
              <div className="border-b border-slate-400 pb-1 flex justify-between items-end">
                <span className="text-[9px] text-slate-400 font-mono">Signature: {invoice.customer}</span>
                <span className="text-[9px] text-slate-400 font-mono">Date: {invoice.issueDate}</span>
              </div>
            </div>

            <div className="space-y-6">
              <p className="font-semibold text-slate-700">Authorized Workshop Representative & Stamp:</p>
              <div className="border-b border-slate-400 pb-1 flex justify-between items-end">
                <span className="text-[9px] text-emerald-800 font-bold font-mono">[ AutoCare Pro Official Seal ]</span>
                <span className="text-[9px] text-slate-400 font-mono">Jordan Hayes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls Toolbar (hidden during print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 no-print">
        <div className="flex items-center gap-2">
          {!isPaid && onRecordPayment && (
            <button
              onClick={() => onRecordPayment(invoice)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-subtle transition-colors cursor-pointer"
            >
              <CheckCircle size={15} weight="bold" />
              Record Payment (${balanceDue.toFixed(2)})
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-subtle transition-colors cursor-pointer"
          >
            <Printer size={15} weight="bold" />
            Print Official Invoice / PDF
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-app-hover hover:bg-app-hover/80 text-app-text text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
