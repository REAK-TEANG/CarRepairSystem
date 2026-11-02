import { useState, useMemo, useRef, useEffect } from 'react'
import {
  FileText,
  DownloadSimple,
  Printer,
  FileXls,
  FilePdf,
  CurrencyDollar,
  Wrench,
  Package,
  Users,
  MagnifyingGlass,
  CalendarBlank,
  CaretDown,
  X,
  ArrowUpRight,
} from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useReports } from '@/hooks/useReports'
import { useInvoices } from '@/hooks/useInvoices'
import { useRepairJobs } from '@/hooks/useRepairJobs'
import { useInventory } from '@/hooks/useInventory'
import { useMechanics } from '@/hooks/useMechanics'
import { useCustomers } from '@/hooks/useCustomers'
import { useVehicles } from '@/hooks/useVehicles'
import { CardSkeleton, Button, DatePicker } from '@/components/ui'
import {
  exportReportToPdf,
  exportReportToExcel,
  printReport,
} from '@/services/reportExportService'

/**
 * Format currency helper
 */
function fmt(val) {
  const num = Number(val) || 0
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Parse any date representation into Date object
 */
function parseDate(item) {
  const raw =
    item.issueDate ||
    item.createdAt ||
    item.date ||
    item.registrationDate ||
    item.created_at ||
    item.issued_date
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

export default function ReportsPage() {
  const { t } = useTranslation()

  // Tab category: 'All' | 'Financial' | 'Operations' | 'Inventory' | 'Mechanics' | 'Customers'
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Date Range Filter
  const [timeRange, setTimeRange] = useState('all') // 'all' | 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'this_year' | 'custom'
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split('T')[0])
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false)
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false)

  const timeDropdownRef = useRef(null)
  const exportDropdownRef = useRef(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(e.target)) {
        setIsTimeDropdownOpen(false)
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setIsExportDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Live Query Hooks
  const { data: reportsData, isLoading: reportsLoading } = useReports()
  const { data: invoicesQuery, isLoading: invoicesLoading } = useInvoices({ all: true })
  const { data: jobsQuery, isLoading: jobsLoading } = useRepairJobs({ all: true })
  const { data: inventoryQuery, isLoading: inventoryLoading } = useInventory({ all: true })
  const { data: mechanicsQuery } = useMechanics()
  const { data: customersQuery } = useCustomers()
  const { data: vehiclesQuery } = useVehicles()

  const rawInvoices = useMemo(() => (Array.isArray(invoicesQuery) ? invoicesQuery : (invoicesQuery?.data || [])), [invoicesQuery])
  const rawRepairJobs = useMemo(() => (Array.isArray(jobsQuery) ? jobsQuery : (jobsQuery?.data || [])), [jobsQuery])
  const rawInventory = useMemo(() => (Array.isArray(inventoryQuery) ? inventoryQuery : (inventoryQuery?.data || [])), [inventoryQuery])
  const rawMechanics = useMemo(() => (Array.isArray(mechanicsQuery) ? mechanicsQuery : (mechanicsQuery?.data || [])), [mechanicsQuery])
  const rawCustomers = useMemo(() => (Array.isArray(customersQuery) ? customersQuery : (customersQuery?.data || [])), [customersQuery])
  const rawVehicles = useMemo(() => (Array.isArray(vehiclesQuery) ? vehiclesQuery : (vehiclesQuery?.data || [])), [vehiclesQuery])

  const isInitialLoading =
    reportsLoading || invoicesLoading || jobsLoading || inventoryLoading

  // Calculate Active Date Range Bounds
  const activeBounds = useMemo(() => {
    const now = new Date()
    if (timeRange === 'today') {
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      return { start, end, label: t('reports.today', 'Today') }
    }
    if (timeRange === 'this_week') {
      const day = now.getDay()
      const diff = (day + 6) % 7 // Monday
      const start = new Date(now)
      start.setDate(now.getDate() - diff)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      return { start, end, label: t('reports.thisWeek') }
    }
    if (timeRange === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      return { start, end, label: t('reports.thisMonth') }
    }
    if (timeRange === 'this_quarter') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3
      const start = new Date(now.getFullYear(), qMonth, 1, 0, 0, 0, 0)
      const end = new Date(now.getFullYear(), qMonth + 3, 0, 23, 59, 59, 999)
      return { start, end, label: t('reports.thisQuarter') }
    }
    if (timeRange === 'this_year') {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
      return { start, end, label: t('reports.thisYear') }
    }
    if (timeRange === 'custom' && customStart && customEnd) {
      const start = new Date(`${customStart}T00:00:00`)
      const end = new Date(`${customEnd}T23:59:59.999`)
      return { start, end, label: `${customStart} → ${customEnd}` }
    }
    return { start: null, end: null, label: t('reports.allTime', 'All Time') }
  }, [timeRange, customStart, customEnd, t])

  // Date Filtered Datasets
  const invoices = useMemo(() => {
    const list = Array.isArray(rawInvoices) ? rawInvoices : []
    if (!activeBounds.start) return list
    return list.filter((i) => {
      const d = parseDate(i)
      return d ? d >= activeBounds.start && d <= activeBounds.end : true
    })
  }, [rawInvoices, activeBounds])

  const repairJobs = useMemo(() => {
    const list = Array.isArray(rawRepairJobs) ? rawRepairJobs : []
    if (!activeBounds.start) return list
    return list.filter((j) => {
      const d = parseDate(j)
      return d ? d >= activeBounds.start && d <= activeBounds.end : true
    })
  }, [rawRepairJobs, activeBounds])

  const inventory = useMemo(() => (Array.isArray(rawInventory) ? rawInventory : []), [rawInventory])
  const mechanics = useMemo(() => (Array.isArray(rawMechanics) ? rawMechanics : []), [rawMechanics])
  const customers = useMemo(() => (Array.isArray(rawCustomers) ? rawCustomers : []), [rawCustomers])

  // Comprehensive Top KPI Calculations
  const totalInvoiced = invoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  const totalPaid = invoices.reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0)
  const totalDue = Math.max(0, totalInvoiced - totalPaid)
  const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 100

  const totalOrdersCount = repairJobs.length
  const completedOrdersCount = repairJobs.filter((j) => j.status === 'Completed').length
  const activeOrdersCount = totalOrdersCount - completedOrdersCount
  const completionRate =
    totalOrdersCount > 0 ? Math.round((completedOrdersCount / totalOrdersCount) * 100) : 100

  const totalStockUnits = inventory.reduce((sum, p) => sum + (Number(p.stockQty) || 0), 0)
  const totalInventoryVal = inventory.reduce(
    (sum, p) => sum + (Number(p.unitPrice) || 0) * (Number(p.stockQty) || 0),
    0
  )
  const lowStockCount = inventory.filter(
    (p) => Number(p.stockQty) <= (Number(p.minThreshold) || 5)
  ).length

  const totalCustomersCount = customers.length
  const totalVehiclesCount = rawVehicles.length

  // Curated Reports list from backend or curated fallback
  const curatedReports = reportsData?.reports || [
    {
      id: 1,
      title: 'Monthly Revenue & Invoices Audit',
      summary: 'Comprehensive billing audit, receivables, paid invoices, and payment methods.',
      category: 'Financial',
      date: activeBounds.label,
      format: 'PDF · Excel · Print',
    },
    {
      id: 2,
      title: 'Mechanic Workload & Labor Efficiency',
      summary: 'Breakdown of assigned work orders, completion rates, and active workshop pipeline.',
      category: 'Operations',
      date: activeBounds.label,
      format: 'PDF · Excel · Print',
    },
    {
      id: 3,
      title: 'Spare Parts Valuation & Stock Audit',
      summary: 'Current inventory levels, valuation assets, reorder thresholds, and low-stock alerts.',
      category: 'Inventory',
      date: activeBounds.label,
      format: 'PDF · Excel · Print',
    },
    {
      id: 4,
      title: 'Customer Accounts & Lifetime Value',
      summary: 'Client directory spending history, registered vehicles, and appointment retention.',
      category: 'Customers',
      date: activeBounds.label,
      format: 'PDF · Excel · Print',
    },
    {
      id: 5,
      title: 'Workshop Work Orders & Service History',
      summary: 'Operational logs of diagnostic inspections, repair orders, and status turnaround.',
      category: 'Operations',
      date: activeBounds.label,
      format: 'PDF · Excel · Print',
    },
  ]

  // Filtered Tab Items with Search
  const query = searchQuery.trim().toLowerCase()

  const filteredInvoices = useMemo(() => {
    if (!query) return invoices
    return invoices.filter(
      (i) =>
        i.invoiceNumber?.toLowerCase().includes(query) ||
        i.orderNumber?.toLowerCase().includes(query) ||
        i.customer?.toLowerCase().includes(query) ||
        i.status?.toLowerCase().includes(query) ||
        i.paymentMethod?.toLowerCase().includes(query)
    )
  }, [invoices, query])

  const filteredRepairJobs = useMemo(() => {
    if (!query) return repairJobs
    return repairJobs.filter(
      (j) =>
        j.orderNumber?.toLowerCase().includes(query) ||
        j.customer?.toLowerCase().includes(query) ||
        j.vehicle?.toLowerCase().includes(query) ||
        j.mechanic?.toLowerCase().includes(query) ||
        j.status?.toLowerCase().includes(query) ||
        j.problem?.toLowerCase().includes(query)
    )
  }, [repairJobs, query])

  const filteredInventory = useMemo(() => {
    if (!query) return inventory
    return inventory.filter(
      (p) =>
        p.partCode?.toLowerCase().includes(query) ||
        p.name?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query) ||
        p.status?.toLowerCase().includes(query)
    )
  }, [inventory, query])

  const filteredMechanics = useMemo(() => {
    const enriched = mechanics.map((m) => {
      const assigned = repairJobs.filter(
        (j) => j.mechanicId === m.id || j.mechanic === m.name
      )
      const completed = assigned.filter((j) => j.status === 'Completed').length
      const active = assigned.length - completed
      const rate = assigned.length > 0 ? Math.round((completed / assigned.length) * 100) : 100
      return {
        ...m,
        assignedCount: assigned.length,
        completedCount: completed,
        activeCount: active,
        efficiencyRate: `${rate}%`,
      }
    })
    if (!query) return enriched
    return enriched.filter(
      (m) =>
        m.name?.toLowerCase().includes(query) ||
        m.specialization?.toLowerCase().includes(query) ||
        m.code?.toLowerCase().includes(query)
    )
  }, [mechanics, repairJobs, query])

  const filteredCustomers = useMemo(() => {
    if (!query) return customers
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(query) ||
        c.phone?.toLowerCase().includes(query) ||
        c.code?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query)
    )
  }, [customers, query])

  // =========================================================================
  // EXPORT ENGINE CONFIGURATIONS (PDF, EXCEL, PRINT)
  // =========================================================================

  const getExportBundle = (categoryKey = selectedCategory) => {
    const rangeLabel = activeBounds.label

    if (categoryKey === 'Financial') {
      const columns = [
        { header: 'Invoice #', key: 'invoiceNumber' },
        { header: 'Date', key: 'issueDate' },
        { header: 'Customer', key: 'customer' },
        { header: 'Work Order #', key: 'orderNumber' },
        { header: 'Payment Method', key: 'paymentMethod' },
        { header: 'Status', key: 'status', align: 'center' },
        { header: 'Amount ($)', key: 'amount', format: 'currency', align: 'right' },
        { header: 'Paid ($)', key: 'paidAmount', format: 'currency', align: 'right' },
        { header: 'Balance ($)', key: 'balanceDue', format: 'currency', align: 'right' },
      ]
      const kpis = [
        { label: 'Total Invoiced', value: fmt(totalInvoiced) },
        { label: 'Cash Collected', value: fmt(totalPaid) },
        { label: 'Outstanding Balance', value: fmt(totalDue) },
        { label: 'Collection Rate', value: `${collectionRate}%` },
      ]
      const summaryTotals = [
        'TOTALS',
        `${filteredInvoices.length} Invoices`,
        '',
        '',
        '',
        '',
        fmt(filteredInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0)),
        fmt(filteredInvoices.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0)),
        fmt(filteredInvoices.reduce((s, i) => s + (Number(i.balanceDue) || 0), 0)),
      ]
      return {
        title: 'Financial Revenue & Invoices Audit Report',
        category: 'Financial',
        dateRange: rangeLabel,
        kpis,
        columns,
        data: filteredInvoices,
        summaryTotals,
        fileName: 'financial_revenue_audit',
      }
    }

    if (categoryKey === 'Operations') {
      const columns = [
        { header: 'Order #', key: 'orderNumber' },
        { header: 'Date', key: 'createdAt' },
        { header: 'Customer', key: 'customer' },
        { header: 'Vehicle', key: 'vehicle' },
        { header: 'Mechanic', key: 'mechanic' },
        { header: 'Diagnostic / Problem', key: 'problem' },
        { header: 'Status', key: 'status', align: 'center' },
        { header: 'Est. Cost', key: 'estimatedCost', align: 'right' },
      ]
      const kpis = [
        { label: 'Total Orders', value: String(totalOrdersCount) },
        { label: 'Completed Jobs', value: String(completedOrdersCount) },
        { label: 'Active Pipeline', value: String(activeOrdersCount) },
        { label: 'Completion Rate', value: `${completionRate}%` },
      ]
      const summaryTotals = [
        'TOTALS',
        `${filteredRepairJobs.length} Orders`,
        '',
        '',
        '',
        '',
        `${completedOrdersCount} Done`,
        '',
      ]
      return {
        title: 'Operations & Work Orders Diagnostic Report',
        category: 'Operations',
        dateRange: rangeLabel,
        kpis,
        columns,
        data: filteredRepairJobs,
        summaryTotals,
        fileName: 'operations_work_orders',
      }
    }

    if (categoryKey === 'Inventory') {
      const columns = [
        { header: 'SKU / Code', key: 'partCode' },
        { header: 'Part Name', key: 'name' },
        { header: 'Category', key: 'category' },
        { header: 'Brand', key: 'brand' },
        { header: 'Stock Qty', key: 'stockQty', format: 'number', align: 'right' },
        { header: 'Min Buffer', key: 'minThreshold', format: 'number', align: 'right' },
        { header: 'Unit Price ($)', key: 'unitPrice', format: 'currency', align: 'right' },
        { header: 'Total Value ($)', key: 'totalVal', format: 'currency', align: 'right' },
        { header: 'Status', key: 'status', align: 'center' },
      ]
      const enriched = filteredInventory.map((p) => ({
        ...p,
        totalVal: (Number(p.unitPrice) || 0) * (Number(p.stockQty) || 0),
      }))
      const kpis = [
        { label: 'Total Units in Stock', value: String(totalStockUnits) },
        { label: 'Total Inventory Value', value: fmt(totalInventoryVal) },
        { label: 'Low Stock Alerts', value: String(lowStockCount) },
        { label: 'Active Catalog SKUs', value: String(inventory.length) },
      ]
      const summaryTotals = [
        'TOTALS',
        `${enriched.length} Parts`,
        '',
        '',
        String(enriched.reduce((s, p) => s + (Number(p.stockQty) || 0), 0)),
        '',
        '',
        fmt(enriched.reduce((s, p) => s + (Number(p.totalVal) || 0), 0)),
        '',
      ]
      return {
        title: 'Spare Parts Inventory & Stock Valuation Audit',
        category: 'Inventory',
        dateRange: rangeLabel,
        kpis,
        columns,
        data: enriched,
        summaryTotals,
        fileName: 'inventory_valuation_audit',
      }
    }

    if (categoryKey === 'Mechanics') {
      const columns = [
        { header: 'ID / Code', key: 'code' },
        { header: 'Technician Name', key: 'name' },
        { header: 'Specialization', key: 'specialization' },
        { header: 'Assigned Jobs', key: 'assignedCount', format: 'number', align: 'right' },
        { header: 'Completed Jobs', key: 'completedCount', format: 'number', align: 'right' },
        { header: 'Active Jobs', key: 'activeCount', format: 'number', align: 'right' },
        { header: 'Efficiency', key: 'efficiencyRate', align: 'center' },
        { header: 'Status', key: 'status', align: 'center' },
      ]
      const kpis = [
        { label: 'Total Technicians', value: String(mechanics.length) },
        { label: 'Total Jobs Handled', value: String(repairJobs.length) },
        { label: 'Jobs In Bay', value: String(activeOrdersCount) },
        { label: 'Shop Completion', value: `${completionRate}%` },
      ]
      const summaryTotals = [
        'TOTALS',
        `${filteredMechanics.length} Staff`,
        '',
        String(filteredMechanics.reduce((s, m) => s + m.assignedCount, 0)),
        String(filteredMechanics.reduce((s, m) => s + m.completedCount, 0)),
        String(filteredMechanics.reduce((s, m) => s + m.activeCount, 0)),
        '',
        '',
      ]
      return {
        title: 'Technician Labor & Bay Productivity Report',
        category: 'Mechanics',
        dateRange: rangeLabel,
        kpis,
        columns,
        data: filteredMechanics,
        summaryTotals,
        fileName: 'technician_labor_productivity',
      }
    }

    if (categoryKey === 'Customers') {
      const columns = [
        { header: 'Customer Code', key: 'code' },
        { header: 'Customer Name', key: 'name' },
        { header: 'Phone', key: 'phone' },
        { header: 'Email', key: 'email' },
        { header: 'Vehicles', key: 'vehiclesCount', format: 'number', align: 'right' },
        { header: 'Total Spent', key: 'totalSpent', align: 'right' },
      ]
      const kpis = [
        { label: 'Registered Clients', value: String(totalCustomersCount) },
        { label: 'Fleet Vehicles', value: String(totalVehiclesCount) },
        { label: 'Gross Invoiced', value: fmt(totalInvoiced) },
        { label: 'Average Ticket', value: totalOrdersCount > 0 ? fmt(totalInvoiced / totalOrdersCount) : '$0.00' },
      ]
      const summaryTotals = [
        'TOTALS',
        `${filteredCustomers.length} Clients`,
        '',
        '',
        String(filteredCustomers.reduce((s, c) => s + (Number(c.vehiclesCount) || 0), 0)),
        '',
      ]
      return {
        title: 'Customer Directory & Accounts Summary Report',
        category: 'Customers',
        dateRange: rangeLabel,
        kpis,
        columns,
        data: filteredCustomers,
        summaryTotals,
        fileName: 'customer_directory_accounts',
      }
    }

    // Default 'All' Executive Comprehensive Report
    const columns = [
      { header: 'Invoice #', key: 'invoiceNumber' },
      { header: 'Date', key: 'issueDate' },
      { header: 'Customer', key: 'customer' },
      { header: 'Work Order #', key: 'orderNumber' },
      { header: 'Status', key: 'status', align: 'center' },
      { header: 'Amount ($)', key: 'amount', format: 'currency', align: 'right' },
      { header: 'Paid ($)', key: 'paidAmount', format: 'currency', align: 'right' },
      { header: 'Balance ($)', key: 'balanceDue', format: 'currency', align: 'right' },
    ]
    const kpis = [
      { label: 'Total Invoiced', value: fmt(totalInvoiced) },
      { label: 'Total Collected', value: fmt(totalPaid) },
      { label: 'Active Work Orders', value: `${activeOrdersCount} / ${totalOrdersCount}` },
      { label: 'Inventory Valuation', value: fmt(totalInventoryVal) },
    ]
    const summaryTotals = [
      'TOTALS',
      `${filteredInvoices.length} Invoices`,
      '',
      '',
      '',
      fmt(totalInvoiced),
      fmt(totalPaid),
      fmt(totalDue),
    ]
    return {
      title: 'Workshop Executive Operational & Financial Audit',
      category: 'Executive Summary',
      dateRange: rangeLabel,
      kpis,
      columns,
      data: filteredInvoices,
      summaryTotals,
      fileName: 'workshop_executive_audit',
    }
  }

  // Trigger Handlers
  const handleExportPdf = (categoryKey = selectedCategory) => {
    setIsExportDropdownOpen(false)
    const bundle = getExportBundle(categoryKey)
    exportReportToPdf(bundle)
  }

  const handleExportExcel = (categoryKey = selectedCategory) => {
    setIsExportDropdownOpen(false)
    const bundle = getExportBundle(categoryKey)
    exportReportToExcel(bundle)
  }

  const handlePrint = (categoryKey = selectedCategory) => {
    setIsExportDropdownOpen(false)
    const bundle = getExportBundle(categoryKey)
    printReport(bundle)
  }

  const categories = [
    { key: 'All', label: t('reports.allCategories', 'All Reports') },
    { key: 'Financial', label: t('reports.financialAudit', 'Financial') },
    { key: 'Operations', label: t('reports.operationsAudit', 'Operations') },
    { key: 'Inventory', label: t('reports.inventoryAudit', 'Inventory') },
    { key: 'Mechanics', label: t('reports.mechanicsAudit', 'Technicians') },
    { key: 'Customers', label: t('reports.customersAudit', 'Customers') },
  ]

  return (
    <div className="space-y-4 sm:space-y-5 text-app-text font-sans">
      {/* ============================================================ */}
      {/* 1. TOP HEADER & EXPORT ACTION CONTROLS                       */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-semibold tracking-tight text-app-text">
            {t('titles.analyticsReports')}
          </h1>
          <span className="text-[11px] font-mono text-app-muted px-2 py-0.5 bg-app-card border border-app-border rounded-md">
            {selectedCategory === 'Financial'
              ? filteredInvoices.length
              : selectedCategory === 'Operations'
              ? filteredRepairJobs.length
              : selectedCategory === 'Inventory'
              ? filteredInventory.length
              : selectedCategory === 'Mechanics'
              ? filteredMechanics.length
              : selectedCategory === 'Customers'
              ? filteredCustomers.length
              : curatedReports.length}
          </span>
        </div>

        {/* Global Action Group: Date Range + Export Hub */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Time Filter Dropdown */}
          <div ref={timeDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsTimeDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 bg-app-card border border-app-border hover:border-app-accent/50 text-app-text rounded-md text-xs font-medium shadow-xs transition-colors cursor-pointer select-none"
            >
              <CalendarBlank size={14} className="text-app-muted" weight="bold" />
              <span>{activeBounds.label}</span>
              <CaretDown
                size={12}
                className={`text-app-muted transition-transform duration-200 ${
                  isTimeDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isTimeDropdownOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-72 bg-app-card border border-app-border rounded-lg shadow-xl p-3 z-50 animate-modal-content space-y-3">
                <div className="grid grid-cols-2 gap-1 p-1 bg-app-hover/60 rounded-md">
                  {[
                    { key: 'all', label: t('reports.allTime', 'All Time') },
                    { key: 'today', label: t('reports.today', 'Today') },
                    { key: 'this_week', label: t('reports.thisWeek') },
                    { key: 'this_month', label: t('reports.thisMonth') },
                    { key: 'this_quarter', label: t('reports.thisQuarter', 'This Quarter') },
                    { key: 'this_year', label: t('reports.thisYear', 'This Year') },
                    { key: 'custom', label: t('reports.customDate', 'Custom') },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setTimeRange(item.key)
                        if (item.key !== 'custom') setIsTimeDropdownOpen(false)
                      }}
                      className={`min-h-[36px] py-1.5 px-2 text-xs font-semibold rounded transition-colors text-center cursor-pointer flex items-center justify-center ${
                        item.key === 'custom' ? 'col-span-2' : ''
                      } ${
                        timeRange === item.key
                          ? 'bg-app-accent text-app-accentText shadow-xs'
                          : 'text-app-muted hover:text-app-text'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {timeRange === 'custom' && (
                  <div className="space-y-2 pt-1 border-t border-app-border">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[11px] text-app-muted font-medium mb-1">
                          {t('reports.startDate', 'Start Date')}
                        </label>
                        <DatePicker
                          value={customStart}
                          onChange={(e) => setCustomStart(e.target.value)}
                          placeholder="Start Date"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-app-muted font-medium mb-1">
                          {t('reports.endDate', 'End Date')}
                        </label>
                        <DatePicker
                          value={customEnd}
                          onChange={(e) => setCustomEnd(e.target.value)}
                          placeholder="End Date"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTimeDropdownOpen(false)}
                      className="w-full py-1.5 px-3 bg-app-accent text-app-accentText font-semibold rounded-md text-xs hover:bg-app-accentHover transition-colors cursor-pointer text-center"
                    >
                      {t('reports.apply', 'Apply Range')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Export Hub Dropdown */}
          <div ref={exportDropdownRef} className="relative">
            <Button
              onClick={() => setIsExportDropdownOpen((prev) => !prev)}
              size="sm"
              className="gap-2"
              title={t('reports.exportReport')}
            >
              <DownloadSimple size={14} weight="bold" />
              <span className="hidden sm:inline">{t('reports.exportReport')}</span>
              <CaretDown
                size={12}
                className={`transition-transform duration-200 ${
                  isExportDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </Button>

            {isExportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-app-card border border-app-border rounded-lg shadow-xl p-1.5 z-50 animate-modal-content space-y-1">
                <button
                  type="button"
                  onClick={() => handleExportPdf()}
                  className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-app-text hover:bg-app-hover rounded-md transition-colors cursor-pointer text-left"
                >
                  <FilePdf size={16} weight="bold" className="text-rose-500 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">{t('reports.exportPdf', 'Export PDF')}</div>
                    <div className="text-[10px] text-app-muted">Vector layout with tables & totals</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportExcel()}
                  className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-app-text hover:bg-app-hover rounded-md transition-colors cursor-pointer text-left"
                >
                  <FileXls size={16} weight="bold" className="text-emerald-500 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">{t('reports.exportExcel', 'Export Excel (.xlsx)')}</div>
                    <div className="text-[10px] text-app-muted">Native workbook with column widths</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrint()}
                  className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-app-text hover:bg-app-hover rounded-md transition-colors cursor-pointer text-left"
                >
                  <Printer size={16} weight="bold" className="text-sky-500 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">{t('reports.printReport', 'Print Report')}</div>
                    <div className="text-[10px] text-app-muted">Clean paper layout preview</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. HIGH DENSITY EXECUTIVE KPI SUMMARY CARDS                  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {isInitialLoading ? (
          Array.from({ length: 4 }).map((_, idx) => <CardSkeleton key={idx} />)
        ) : (
          <>
            {/* Total Invoiced & Collections */}
            <div className="bg-app-card rounded-lg border border-app-border p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-app-muted tracking-tight">
                  {t('dashboard.totalRevenue')}
                </span>
                <CurrencyDollar size={18} weight="bold" className="text-app-accent flex-shrink-0" />
              </div>
              <div className="mt-1">
                <p className="font-mono font-semibold text-2xl text-app-text tabular-nums">
                  {fmt(totalInvoiced)}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-app-muted">
                  <span>
                    Paid: <strong className="text-emerald-500 font-mono">{fmt(totalPaid)}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Due: <strong className="text-amber-500 font-mono">{fmt(totalDue)}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Repair Orders & Completion Rate */}
            <div className="bg-app-card rounded-lg border border-app-border p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-app-muted tracking-tight">
                  {t('repairJobs.title')}
                </span>
                <Wrench size={18} weight="bold" className="text-emerald-500 flex-shrink-0" />
              </div>
              <div className="mt-1">
                <p className="font-mono font-semibold text-2xl text-app-text tabular-nums">
                  {completedOrdersCount} <span className="text-sm font-normal text-app-muted">/ {totalOrdersCount}</span>
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-app-muted">
                  <span>
                    Rate: <strong className="text-emerald-500 font-mono">{completionRate}%</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Active: <strong className="text-app-text font-mono">{activeOrdersCount}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Inventory Valuation & Alerts */}
            <div className="bg-app-card rounded-lg border border-app-border p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-app-muted tracking-tight">
                  {t('reports.inventoryAudit', 'Inventory Valuation')}
                </span>
                <Package size={18} weight="bold" className="text-amber-500 flex-shrink-0" />
              </div>
              <div className="mt-1">
                <p className="font-mono font-semibold text-2xl text-app-text tabular-nums">
                  {fmt(totalInventoryVal)}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-app-muted">
                  <span>
                    Units: <strong className="text-app-text font-mono">{totalStockUnits}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Low Stock:{' '}
                    <strong className={lowStockCount > 0 ? 'text-rose-500 font-mono' : 'text-emerald-500 font-mono'}>
                      {lowStockCount}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Customers & Fleet */}
            <div className="bg-app-card rounded-lg border border-app-border p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-app-muted tracking-tight">
                  {t('customers.title')} & Fleet
                </span>
                <Users size={18} weight="bold" className="text-sky-500 flex-shrink-0" />
              </div>
              <div className="mt-1">
                <p className="font-mono font-semibold text-2xl text-app-text tabular-nums">
                  {totalCustomersCount}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-app-muted">
                  <span>
                    Vehicles: <strong className="text-app-text font-mono">{totalVehiclesCount}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Staff: <strong className="text-app-text font-mono">{mechanics.length}</strong>
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/* 3. CONTROLS BAR: CATEGORY TABS & LIVE SEARCH                 */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => {
                setSelectedCategory(cat.key)
                setSearchQuery('')
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.key
                  ? 'bg-app-accent text-app-accentText font-semibold shadow-xs'
                  : 'text-app-muted hover:text-app-text hover:bg-app-hover'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Live Filter Search Box */}
        <div className="relative w-full sm:w-72">
          <MagnifyingGlass
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-muted"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('reports.searchReports', 'Filter records by keyword...')}
            className="w-full pl-8 pr-7 py-1.5 bg-app-card border border-app-border rounded-md text-xs text-app-text placeholder:text-app-muted/70 focus:outline-none focus:border-app-accent shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text cursor-pointer"
            >
              <X size={12} weight="bold" />
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. MAIN REPORT CONTENT AREA BY CATEGORY                      */}
      {/* ============================================================ */}

      {/* CATEGORY: FINANCIAL INVOICES & REVENUE */}
      {selectedCategory === 'Financial' && (
        <div className="bg-app-card rounded-lg border border-app-border shadow-xs overflow-hidden">
          <div className="p-3 bg-app-card border-b border-app-border flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-app-text">
                {t('reports.financialAudit', 'Financial Audit')}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button size="xs" variant="outline" onClick={() => handleExportPdf('Financial')} title="Export PDF">
                <FilePdf size={13} weight="bold" className="text-rose-500" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button size="xs" variant="outline" onClick={() => handleExportExcel('Financial')} title="Export Excel">
                <FileXls size={13} weight="bold" className="text-emerald-500" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
              <Button size="xs" variant="outline" onClick={() => handlePrint('Financial')} title="Print">
                <Printer size={13} weight="bold" className="text-sky-500" />
                <span className="hidden sm:inline">Print</span>
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-app-hover/50 text-app-muted border-b border-app-border font-medium">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Payment Method</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-app-muted text-xs">
                      No invoices found for this criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-app-hover/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-app-text">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-app-muted">{inv.issueDate}</td>
                      <td className="py-2.5 px-3 font-medium text-app-text">{inv.customer}</td>
                      <td className="py-2.5 px-3 font-mono text-app-muted">{inv.orderNumber}</td>
                      <td className="py-2.5 px-3 text-app-muted">{inv.paymentMethod}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                              : inv.status === 'Partial'
                              ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
                              : 'bg-rose-500/15 text-rose-500 border border-rose-500/20'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-app-text">
                        {fmt(inv.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-500">
                        {fmt(inv.paidAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-500">
                        {fmt(inv.balanceDue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredInvoices.length > 0 && (
                <tfoot className="bg-app-hover/60 border-t-2 border-app-border font-semibold text-app-text">
                  <tr>
                    <td colSpan={6} className="py-2.5 px-3">
                      Total ({filteredInvoices.length} Invoices)
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {fmt(filteredInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0))}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-500">
                      {fmt(filteredInvoices.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0))}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-500">
                      {fmt(filteredInvoices.reduce((s, i) => s + (Number(i.balanceDue) || 0), 0))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* CATEGORY: OPERATIONS WORK ORDERS */}
      {selectedCategory === 'Operations' && (
        <div className="bg-app-card rounded-lg border border-app-border shadow-xs overflow-hidden">
          <div className="p-3 bg-app-card border-b border-app-border flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-app-text">
                {t('reports.operationsAudit', 'Operations Audit')}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button size="xs" variant="outline" onClick={() => handleExportPdf('Operations')} title="Export PDF">
                <FilePdf size={13} weight="bold" className="text-rose-500" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button size="xs" variant="outline" onClick={() => handleExportExcel('Operations')} title="Export Excel">
                <FileXls size={13} weight="bold" className="text-emerald-500" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
              <Button size="xs" variant="outline" onClick={() => handlePrint('Operations')} title="Print">
                <Printer size={13} weight="bold" className="text-sky-500" />
                <span className="hidden sm:inline">Print</span>
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-app-hover/50 text-app-muted border-b border-app-border font-medium">
                <tr>
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Mechanic</th>
                  <th className="py-2.5 px-3">Problem / Diagnostic</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Est. Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filteredRepairJobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-app-muted text-xs">
                      No repair jobs found for this criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRepairJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-app-hover/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-app-text">
                        {job.orderNumber}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-app-muted">{job.createdAt}</td>
                      <td className="py-2.5 px-3 font-medium text-app-text">{job.customer}</td>
                      <td className="py-2.5 px-3 text-app-text">
                        {job.vehicle} {job.plate && `(${job.plate})`}
                      </td>
                      <td className="py-2.5 px-3 text-app-muted">{job.mechanic}</td>
                      <td className="py-2.5 px-3 text-app-muted max-w-xs truncate">{job.problem}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            job.status === 'Completed'
                              ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                              : job.status === 'In Progress'
                              ? 'bg-sky-500/15 text-sky-500 border border-sky-500/20'
                              : 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-app-text">
                        {job.estimatedCost}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CATEGORY: INVENTORY & VALUATION */}
      {selectedCategory === 'Inventory' && (
        <div className="bg-app-card rounded-lg border border-app-border shadow-xs overflow-hidden">
          <div className="p-3 bg-app-card border-b border-app-border flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-app-text">
                {t('reports.inventoryAudit', 'Inventory Audit')}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button size="xs" variant="outline" onClick={() => handleExportPdf('Inventory')} title="Export PDF">
                <FilePdf size={13} weight="bold" className="text-rose-500" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button size="xs" variant="outline" onClick={() => handleExportExcel('Inventory')} title="Export Excel">
                <FileXls size={13} weight="bold" className="text-emerald-500" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
              <Button size="xs" variant="outline" onClick={() => handlePrint('Inventory')} title="Print">
                <Printer size={13} weight="bold" className="text-sky-500" />
                <span className="hidden sm:inline">Print</span>
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-app-hover/50 text-app-muted border-b border-app-border font-medium">
                <tr>
                  <th className="py-2.5 px-3">SKU / Code</th>
                  <th className="py-2.5 px-3">Part Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Brand</th>
                  <th className="py-2.5 px-3 text-right">In Stock</th>
                  <th className="py-2.5 px-3 text-right">Min Buffer</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Asset Value</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-app-muted text-xs">
                      No spare parts match your query.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((part) => {
                    const qty = Number(part.stockQty) || 0
                    const price = Number(part.unitPrice) || 0
                    const val = qty * price
                    const min = Number(part.minThreshold) || 5
                    const isLow = qty <= min
                    return (
                      <tr key={part.id} className="hover:bg-app-hover/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-app-text">
                          {part.partCode}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-app-text">{part.name}</td>
                        <td className="py-2.5 px-3 text-app-muted">{part.category}</td>
                        <td className="py-2.5 px-3 text-app-muted">{part.brand}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-app-text">
                          {qty}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-app-muted">{min}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-app-text">
                          {fmt(price)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-500">
                          {fmt(val)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              qty === 0
                                ? 'bg-rose-500/15 text-rose-500 border border-rose-500/20'
                                : isLow
                                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
                                : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                            }`}
                          >
                            {qty === 0 ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
              {filteredInventory.length > 0 && (
                <tfoot className="bg-app-hover/60 border-t-2 border-app-border font-semibold text-app-text">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-3">
                      Total ({filteredInventory.length} Parts)
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {filteredInventory.reduce((s, p) => s + (Number(p.stockQty) || 0), 0)}
                    </td>
                    <td colSpan={2} className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-500">
                      {fmt(
                        filteredInventory.reduce(
                          (s, p) => s + (Number(p.unitPrice) || 0) * (Number(p.stockQty) || 0),
                          0
                        )
                      )}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* CATEGORY: MECHANICS & PRODUCTIVITY */}
      {selectedCategory === 'Mechanics' && (
        <div className="bg-app-card rounded-lg border border-app-border shadow-xs overflow-hidden">
          <div className="p-3 bg-app-card border-b border-app-border flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-app-text">
                {t('reports.mechanicsAudit', 'Technician Productivity')}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button size="xs" variant="outline" onClick={() => handleExportPdf('Mechanics')} title="Export PDF">
                <FilePdf size={13} weight="bold" className="text-rose-500" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button size="xs" variant="outline" onClick={() => handleExportExcel('Mechanics')} title="Export Excel">
                <FileXls size={13} weight="bold" className="text-emerald-500" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
              <Button size="xs" variant="outline" onClick={() => handlePrint('Mechanics')} title="Print">
                <Printer size={13} weight="bold" className="text-sky-500" />
                <span className="hidden sm:inline">Print</span>
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-app-hover/50 text-app-muted border-b border-app-border font-medium">
                <tr>
                  <th className="py-2.5 px-3">Technician</th>
                  <th className="py-2.5 px-3">Specialization</th>
                  <th className="py-2.5 px-3 text-right">Assigned Jobs</th>
                  <th className="py-2.5 px-3 text-right">Completed</th>
                  <th className="py-2.5 px-3 text-right">Active in Bay</th>
                  <th className="py-2.5 px-3 text-center">Completion Rate</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filteredMechanics.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-app-muted text-xs">
                      No technicians match your search.
                    </td>
                  </tr>
                ) : (
                  filteredMechanics.map((tech) => (
                    <tr key={tech.id} className="hover:bg-app-hover/40 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-app-text">
                        <div>{tech.name}</div>
                        <div className="text-[10px] text-app-muted font-mono">{tech.code}</div>
                      </td>
                      <td className="py-2.5 px-3 text-app-muted">{tech.specialization}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-app-text">
                        {tech.assignedCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald-500">
                        {tech.completedCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-amber-500">
                        {tech.activeCount}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-app-text">
                        {tech.efficiencyRate}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                          {tech.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CATEGORY: CUSTOMERS & FLEET */}
      {selectedCategory === 'Customers' && (
        <div className="bg-app-card rounded-lg border border-app-border shadow-xs overflow-hidden">
          <div className="p-3 bg-app-card border-b border-app-border flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-app-text">
                {t('reports.customersAudit', 'Customer Accounts')}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button size="xs" variant="outline" onClick={() => handleExportPdf('Customers')} title="Export PDF">
                <FilePdf size={13} weight="bold" className="text-rose-500" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button size="xs" variant="outline" onClick={() => handleExportExcel('Customers')} title="Export Excel">
                <FileXls size={13} weight="bold" className="text-emerald-500" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
              <Button size="xs" variant="outline" onClick={() => handlePrint('Customers')} title="Print">
                <Printer size={13} weight="bold" className="text-sky-500" />
                <span className="hidden sm:inline">Print</span>
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-app-hover/50 text-app-muted border-b border-app-border font-medium">
                <tr>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3 text-right">Registered Vehicles</th>
                  <th className="py-2.5 px-3 text-right">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-app-muted text-xs">
                      No customer accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-app-hover/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-app-muted">
                        {cust.code}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-app-text">{cust.name}</td>
                      <td className="py-2.5 px-3 font-mono text-app-muted">{cust.phone}</td>
                      <td className="py-2.5 px-3 text-app-muted">{cust.email || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-app-text">
                        {cust.vehiclesCount || 1}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-500">
                        {cust.totalSpent || '$0.00'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CATEGORY: ALL OVERVIEW & CURATED REPORTS HUB */}
      {selectedCategory === 'All' && (
        <div className="space-y-4">
          {/* Official Workshop Curated Reports Section */}
          <div className="bg-app-card rounded-lg border border-app-border shadow-xs overflow-hidden">
            <div className="p-3 bg-app-card border-b border-app-border flex items-center justify-between gap-2">
              <div>
                <h2 className="text-xs sm:text-sm font-semibold text-app-text">
                  Workshop Reports
                </h2>
              </div>
              <Button size="xs" variant="outline" onClick={() => handleExportPdf('All')}>
                <FilePdf size={13} weight="bold" className="text-rose-500" />
                <span className="hidden sm:inline">Executive PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>
            </div>

            <div className="divide-y divide-app-border">
              {curatedReports.map((report) => (
                <div
                  key={report.id}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-app-hover/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-app-accent/15 border border-app-accent/30 flex items-center justify-center text-app-accent flex-shrink-0 mt-0.5">
                      <FileText size={18} weight="bold" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-app-text">
                        {report.title}
                      </h3>
                      <p className="text-xs text-app-muted mt-0.5">{report.summary}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-app-hover text-app-muted">
                          {report.category}
                        </span>
                        <span className="text-[10px] text-app-muted">· {report.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-center">
                    <Button
                      onClick={() => handleExportPdf(report.category)}
                      variant="outline"
                      size="xs"
                      className="gap-1"
                      title="Export PDF"
                    >
                      <FilePdf size={12} weight="bold" className="text-rose-500" />
                      <span className="hidden sm:inline">PDF</span>
                    </Button>
                    <Button
                      onClick={() => handleExportExcel(report.category)}
                      variant="outline"
                      size="xs"
                      className="gap-1"
                      title="Export Excel"
                    >
                      <FileXls size={12} weight="bold" className="text-emerald-500" />
                      <span className="hidden sm:inline">Excel</span>
                    </Button>
                    <Button
                      onClick={() => handlePrint(report.category)}
                      variant="outline"
                      size="xs"
                      className="gap-1"
                      title="Print Report"
                    >
                      <Printer size={12} weight="bold" className="text-sky-500" />
                      <span className="hidden sm:inline">Print</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Financial Audit Snapshot */}
          <div className="bg-app-card rounded-lg border border-app-border shadow-xs overflow-hidden">
            <div className="p-3 bg-app-card border-b border-app-border flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-app-text">
                  Recent Billing & Invoices Log ({activeBounds.label})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategory('Financial')}
                className="text-xs text-app-accent hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <span className="hidden sm:inline">View Full Financial Table</span>
                <span className="sm:hidden">View Full</span>
                <ArrowUpRight size={12} weight="bold" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-app-hover/50 text-app-muted border-b border-app-border font-medium">
                  <tr>
                    <th className="py-2 px-3">Invoice #</th>
                    <th className="py-2 px-3">Customer</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3 text-right">Paid</th>
                    <th className="py-2 px-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {invoices.slice(0, 5).map((inv) => (
                    <tr key={inv.id} className="hover:bg-app-hover/40 transition-colors">
                      <td className="py-2 px-3 font-mono font-medium text-app-text">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-2 px-3 text-app-text font-medium">{inv.customer}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : 'bg-amber-500/15 text-amber-500'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-app-text">
                        {fmt(inv.amount)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-500">
                        {fmt(inv.paidAmount)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-amber-500">
                        {fmt(inv.balanceDue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
