import { apiClient, API_CONFIG } from './apiClient'

const STORAGE_KEY = 'demo_inventory'

export const initialSpareParts = [
  { id: 1, partCode: 'PRT-BRK-001', name: 'Ceramic Brake Pads (Front)', category: 'Brakes', brand: 'Brembo', unitPrice: 65.00, stockQty: 24, minThreshold: 10, location: 'Shelf A-12', supplier: 'AutoParts Direct', status: 'In Stock' },
  { id: 2, partCode: 'PRT-OIL-002', name: 'Synthetic Engine Oil 5W-30 (5L)', category: 'Fluids', brand: 'Mobil 1', unitPrice: 42.50, stockQty: 48, minThreshold: 15, location: 'Aisle B-01', supplier: 'LubeCorp Wholesale', status: 'In Stock' },
  { id: 3, partCode: 'PRT-FLT-003', name: 'Engine Oil Filter', category: 'Filters', brand: 'Bosch', unitPrice: 12.00, stockQty: 5, minThreshold: 12, location: 'Shelf A-04', supplier: 'AutoParts Direct', status: 'Low Stock' },
  { id: 4, partCode: 'PRT-SPK-004', name: 'Iridium Spark Plugs (Set of 4)', category: 'Ignition', brand: 'NGK', unitPrice: 38.00, stockQty: 18, minThreshold: 8, location: 'Shelf C-02', supplier: 'NGK Global', status: 'In Stock' },
  { id: 5, partCode: 'PRT-BAT-005', name: '12V AGM Car Battery 70Ah', category: 'Electrical', brand: 'Varta', unitPrice: 145.00, stockQty: 3, minThreshold: 6, location: 'Rack D-01', supplier: 'PowerCell Tech', status: 'Low Stock' },
  { id: 6, partCode: 'PRT-TIR-006', name: 'Michelin Pilot Sport 4 225/45 R17', category: 'Tires', brand: 'Michelin', unitPrice: 135.00, stockQty: 0, minThreshold: 4, location: 'Tire Bay 2', supplier: 'TireHub Supply', status: 'Out of Stock' },
]

function getLocalData() {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try { return JSON.parse(data) } catch { /* fallback */ }
  }
  return initialSpareParts
}

function saveLocalData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const inventoryService = {
  async getAll() {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.get('/spare-parts')
    }
    return Promise.resolve(getLocalData())
  },

  async create(payload) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.post('/spare-parts', payload)
    }
    const current = getLocalData()
    const qty = Number(payload.stockQty) || 0
    const min = Number(payload.minThreshold) || 5
    const newPart = {
      id: Date.now(),
      partCode: payload.partCode || `PRT-GEN-${String(current.length + 1).padStart(3, '0')}`,
      stockQty: qty,
      minThreshold: min,
      unitPrice: Number(payload.unitPrice) || 0,
      status: qty === 0 ? 'Out of Stock' : qty <= min ? 'Low Stock' : 'In Stock',
      ...payload,
    }
    const updated = [newPart, ...current]
    saveLocalData(updated)
    return Promise.resolve(newPart)
  },

  async update(id, payload) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.put(`/spare-parts/${id}`, payload)
    }
    const current = getLocalData()
    const updated = current.map((p) => {
      if (p.id === Number(id)) {
        const merged = { ...p, ...payload }
        const qty = Number(merged.stockQty) || 0
        const min = Number(merged.minThreshold) || 5
        merged.status = qty === 0 ? 'Out of Stock' : qty <= min ? 'Low Stock' : 'In Stock'
        return merged
      }
      return p
    })
    saveLocalData(updated)
    return Promise.resolve({ id, ...payload })
  },

  async adjustStock(id, { quantity, type, notes }) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.post(`/spare-parts/${id}/adjust`, { quantity, type, notes })
    }
    const current = getLocalData()
    const delta = Number(quantity) || 0
    const updated = current.map((p) => {
      if (p.id === Number(id)) {
        let newQty = p.stockQty
        if (type === 'Stock In') newQty += delta
        else if (type === 'Stock Out') newQty = Math.max(0, newQty - delta)
        else if (type === 'Adjustment') newQty = delta
        const min = p.minThreshold
        const status = newQty === 0 ? 'Out of Stock' : newQty <= min ? 'Low Stock' : 'In Stock'
        return { ...p, stockQty: newQty, status }
      }
      return p
    })
    saveLocalData(updated)
    return Promise.resolve({ id, quantity, type, notes, timestamp: new Date().toISOString() })
  },

  async delete(id) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.delete(`/spare-parts/${id}`)
    }
    const current = getLocalData()
    const updated = current.filter((p) => p.id !== Number(id))
    saveLocalData(updated)
    return Promise.resolve({ success: true, id })
  },
}
