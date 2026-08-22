import { apiClient, API_CONFIG } from './apiClient'

const STORAGE_KEY = 'demo_suppliers'

export const initialSuppliers = [
  { id: 1, name: 'AutoParts Direct', contactPerson: 'Harold Finch', phone: '(555) 777-8899', email: 'orders@autopartsdirect.com', address: '88 Industrial Way, Motor City', categories: 'Brakes, Filters, Suspension', rating: 4.8, activeOrders: 2 },
  { id: 2, name: 'LubeCorp Wholesale', contactPerson: 'Elena Rostova', phone: '(555) 888-9900', email: 'sales@lubecorp.com', address: '14 Refinery Rd, Port City', categories: 'Engine Oil, Coolant, Transmission Fluid', rating: 4.9, activeOrders: 1 },
  { id: 3, name: 'NGK Global Supply', contactPerson: 'Kenji Sato', phone: '(555) 999-1122', email: 'support@ngkglobal.com', address: '402 Tech Park, Silicon Valley', categories: 'Spark Plugs, Ignition Coils, Sensors', rating: 4.7, activeOrders: 0 },
  { id: 4, name: 'PowerCell Tech', contactPerson: 'Markus Bauer', phone: '(555) 444-2211', email: 'accounts@powercell.com', address: '22 Voltage Blvd, Electra', categories: 'Batteries, Alternators, Starters', rating: 4.5, activeOrders: 1 },
]

function getLocalData() {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try { return JSON.parse(data) } catch { /* fallback */ }
  }
  return initialSuppliers
}

function saveLocalData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const supplierService = {
  async getAll() {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.get('/suppliers')
    }
    return Promise.resolve(getLocalData())
  },

  async create(payload) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.post('/suppliers', payload)
    }
    const current = getLocalData()
    const newSupplier = {
      id: Date.now(),
      rating: 5.0,
      activeOrders: 0,
      ...payload,
    }
    const updated = [newSupplier, ...current]
    saveLocalData(updated)
    return Promise.resolve(newSupplier)
  },

  async update(id, payload) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.put(`/suppliers/${id}`, payload)
    }
    const current = getLocalData()
    const updated = current.map((s) => (s.id === Number(id) ? { ...s, ...payload } : s))
    saveLocalData(updated)
    return Promise.resolve({ id, ...payload })
  },

  async delete(id) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.delete(`/suppliers/${id}`)
    }
    const current = getLocalData()
    const updated = current.filter((s) => s.id !== Number(id))
    saveLocalData(updated)
    return Promise.resolve({ success: true, id })
  },
}
