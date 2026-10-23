import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

/**
 * Clean string for safe file naming
 */
function sanitizeFilename(str) {
  return str.toLowerCase().replace(/[^a-z0-9_-]/g, '_').replace(/_+/g, '_').slice(0, 50)
}

/**
 * Format currency helper
 */
function formatCurrency(val) {
  const num = Number(val) || 0
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * EXPORT TO PDF (.pdf)
 * Generates an executive, beautifully formatted vector PDF report using jsPDF & autoTable.
 */
export function exportReportToPdf({
  title = 'Workshop Report',
  category = 'General',
  dateRange = 'All Time',
  kpis = [],
  columns = [],
  data = [],
  summaryTotals = null,
  fileName = null,
}) {
  const doc = new jsPDF({
    orientation: columns.length > 7 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const isLandscape = columns.length > 7
  const pageWidth = isLandscape ? 297 : 210
  const marginX = 14

  // 1. BRAND HEADER BANNER
  doc.setFillColor(15, 23, 42) // Slate 900
  doc.rect(0, 0, pageWidth, 24, 'F')

  // Brand Name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text('AUTO REPAIR WORKSHOP MANAGEMENT', marginX, 11)

  // Subtitle
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184) // Slate 400
  doc.text('Executive Operational & Financial Intelligence Report', marginX, 17)

  // Right-aligned Metadata
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  doc.setFontSize(8)
  doc.setTextColor(226, 232, 240)
  doc.text(`Generated: ${dateStr} ${timeStr}`, pageWidth - marginX, 11, { align: 'right' })
  doc.text(`Scope: ${dateRange}`, pageWidth - marginX, 17, { align: 'right' })

  // 2. REPORT TITLE & CATEGORY SECTION
  let cursorY = 32
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(15, 23, 42)
  doc.text(title, marginX, cursorY)

  // Category Tag
  const categoryText = category.toUpperCase()
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  const tagWidth = doc.getTextWidth(categoryText) + 8
  doc.setFillColor(241, 245, 249)
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(pageWidth - marginX - tagWidth, cursorY - 5, tagWidth, 6, 1, 1, 'FD')
  doc.setTextColor(51, 65, 85)
  doc.text(categoryText, pageWidth - marginX - tagWidth + 4, cursorY - 1)

  cursorY += 4

  // Thin separator rule
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.4)
  doc.line(marginX, cursorY, pageWidth - marginX, cursorY)
  cursorY += 5

  // 3. KPI SUMMARY TILES (if provided)
  if (kpis && kpis.length > 0) {
    const cardGap = 4
    const availableWidth = pageWidth - marginX * 2
    const numCards = Math.min(kpis.length, 4)
    const cardWidth = (availableWidth - cardGap * (numCards - 1)) / numCards
    const cardHeight = 16

    kpis.slice(0, 4).forEach((kpi, idx) => {
      const cardX = marginX + idx * (cardWidth + cardGap)
      // Card background
      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(cardX, cursorY, cardWidth, cardHeight, 1.5, 1.5, 'FD')

      // Card label
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(100, 116, 139)
      doc.text(String(kpi.label || '').toUpperCase(), cardX + 3.5, cursorY + 5.5)

      // Card value
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(15, 23, 42)
      doc.text(String(kpi.value || ''), cardX + 3.5, cursorY + 12.5)
    })

    cursorY += cardHeight + 6
  }

  // 4. DATA TABLE
  const tableHeaders = columns.map((col) => col.header)
  const tableRows = data.map((row) =>
    columns.map((col) => {
      const val = row[col.key]
      if (val === null || val === undefined) return '-'
      if (col.format === 'currency') return formatCurrency(val)
      return String(val)
    })
  )

  const footRows = summaryTotals ? [summaryTotals] : undefined

  // Column alignment map
  const columnStyles = {}
  columns.forEach((col, idx) => {
    if (col.align === 'right' || col.format === 'currency' || col.format === 'number') {
      columnStyles[idx] = { halign: 'right' }
    } else if (col.align === 'center') {
      columnStyles[idx] = { halign: 'center' }
    }
  })

  autoTable(doc, {
    startY: cursorY,
    head: [tableHeaders],
    body: tableRows,
    foot: footRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      lineWidth: 0.3,
      lineColor: [148, 163, 184],
    },
    columnStyles,
    margin: { left: marginX, right: marginX, bottom: 15 },
    didDrawPage: (dataObj) => {
      // PAGE FOOTER
      const totalPages = doc.internal.getNumberOfPages()
      const currentPage = dataObj.pageNumber
      const pageHeight = isLandscape ? 210 : 297

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(148, 163, 184)
      doc.text(
        'Auto Repair Management System · Confidential Internal Workshop Report',
        marginX,
        pageHeight - 6
      )
      doc.text(`Page ${currentPage} of ${totalPages}`, pageWidth - marginX, pageHeight - 6, {
        align: 'right',
      })
    },
  })

  const outputName = `${sanitizeFilename(fileName || title)}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(outputName)
}

/**
 * EXPORT TO EXCEL (.xlsx)
 * Generates an actual native Microsoft Excel workbook (.xlsx) with clean column widths and numeric typing.
 */
export function exportReportToExcel({
  title = 'Workshop Report',
  category = 'General',
  dateRange = 'All Time',
  kpis = [],
  columns = [],
  data = [],
  summaryTotals = null,
  fileName = null,
}) {
  const wb = XLSX.utils.book_new()
  const rows = []

  // Metadata block
  rows.push(['AUTO REPAIR WORKSHOP MANAGEMENT SYSTEM'])
  rows.push([`Report: ${title}`, '', `Category: ${category}`])
  rows.push([`Date Range: ${dateRange}`, '', `Exported: ${new Date().toLocaleString()}`])
  rows.push([])

  // KPI Block
  if (kpis && kpis.length > 0) {
    rows.push(['EXECUTIVE SUMMARY'])
    rows.push(kpis.map((k) => k.label))
    rows.push(kpis.map((k) => k.value))
    rows.push([])
  }

  // Header Row
  rows.push(columns.map((c) => c.header))

  // Data Rows
  data.forEach((item) => {
    const row = columns.map((col) => {
      const val = item[col.key]
      if (val === null || val === undefined) return ''
      if (col.format === 'currency' || col.format === 'number') {
        const num = Number(val)
        return isNaN(num) ? val : num
      }
      return val
    })
    rows.push(row)
  })

  // Summary Totals Row
  if (summaryTotals && summaryTotals.length > 0) {
    rows.push([])
    rows.push(summaryTotals)
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Calculate Column Widths
  const colWidths = columns.map((col) => {
    let maxLen = col.header.length
    data.forEach((item) => {
      const val = String(item[col.key] ?? '')
      if (val.length > maxLen) maxLen = val.length
    })
    return { wch: Math.min(Math.max(maxLen + 4, 12), 40) }
  })
  ws['!cols'] = colWidths

  const cleanSheetName = (title.replace(/[^a-zA-Z0-9 ]/g, '') || 'Report').slice(0, 31)
  XLSX.utils.book_append_sheet(wb, ws, cleanSheetName)

  const outputName = `${sanitizeFilename(fileName || title)}_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, outputName, { bookType: 'xlsx' })
}

/**
 * PRINT REPORT
 * Generates an isolated, high-fidelity printable document in a hidden iframe and invokes window.print().
 */
export function printReport({
  title = 'Workshop Report',
  category = 'General',
  dateRange = 'All Time',
  kpis = [],
  columns = [],
  data = [],
  summaryTotals = null,
}) {
  const existingIframe = document.getElementById('report-print-iframe')
  if (existingIframe) existingIframe.remove()

  const iframe = document.createElement('iframe')
  iframe.id = 'report-print-iframe'
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'

  document.body.appendChild(iframe)

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const kpisHtml =
    kpis && kpis.length > 0
      ? `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 20px;">
        ${kpis
          .map(
            (k) => `
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; background-color: #f8fafc;">
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">${k.label}</div>
            <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${k.value}</div>
          </div>
        `
          )
          .join('')}
      </div>
    `
      : ''

  const headersHtml = columns
    .map(
      (c) =>
        `<th style="text-align: ${c.align || (c.format === 'currency' ? 'right' : 'left')}; padding: 8px 10px; background: #0f172a; color: #ffffff; font-size: 11px; font-weight: 600; border: 1px solid #0f172a;">${c.header}</th>`
    )
    .join('')

  const rowsHtml = data
    .map(
      (row, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        ${columns
          .map((col) => {
            const val = row[col.key]
            let displayVal = val === null || val === undefined ? '-' : val
            if (col.format === 'currency') displayVal = formatCurrency(val)
            const align = col.align || (col.format === 'currency' ? 'right' : 'left')
            return `<td style="text-align: ${align}; padding: 7px 10px; border: 1px solid #e2e8f0; font-size: 11px; color: #1e293b;">${displayVal}</td>`
          })
          .join('')}
      </tr>
    `
    )
    .join('')

  const footerHtml =
    summaryTotals && summaryTotals.length > 0
      ? `
      <tr style="background-color: #f1f5f9; font-weight: 700;">
        ${summaryTotals
          .map(
            (val, idx) => `
          <td style="text-align: ${columns[idx]?.align || (columns[idx]?.format === 'currency' ? 'right' : 'left')}; padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; color: #0f172a;">${val || ''}</td>
        `
          )
          .join('')}
      </tr>
    `
      : ''

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @page { size: auto; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 2px solid #0f172a; margin-bottom: 15px; }
          .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 3px; }
          .meta { text-align: right; font-size: 11px; color: #475569; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-variant-numeric: tabular-nums; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
          .print-footer { margin-top: 25px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">AUTO REPAIR WORKSHOP MANAGEMENT</h1>
            <div class="subtitle">${title} · <strong style="color: #0f172a;">${category.toUpperCase()}</strong></div>
          </div>
          <div class="meta">
            <div>Scope: <strong>${dateRange}</strong></div>
            <div>Printed: <strong>${dateStr} ${timeStr}</strong></div>
          </div>
        </div>

        ${kpisHtml}

        <table>
          <thead>
            <tr>${headersHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          ${footerHtml ? `<tfoot>${footerHtml}</tfoot>` : ''}
        </table>

        <div class="print-footer">
          <span>Auto Repair Workshop Management System · Confidential Internal Audit</span>
          <span>Printed from Reports Hub</span>
        </div>
      </body>
    </html>
  `

  const doc = iframe.contentWindow.document
  doc.open()
  doc.write(htmlContent)
  doc.close()

  iframe.contentWindow.focus()
  setTimeout(() => {
    iframe.contentWindow.print()
  }, 250)
}
