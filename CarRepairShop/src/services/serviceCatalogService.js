import { apiClient, API_CONFIG } from './apiClient'

const STORAGE_KEY = 'demo_services'

export const initialServices = [
  { id: 1, name: 'Oil Change', description: 'Engine oil and filter replacement', estimatedCost: 50.00, estimatedHours: 1.0, isActive: true },
  { id: 2, name: 'Engine Repair', description: 'Engine diagnosis and repair', estimatedCost: 500.00, estimatedHours: 8.0, isActive: true },
  { id: 3, name: 'Brake Service', description: 'Brake pad and disc inspection/replacement', estimatedCost: 200.00, estimatedHours: 2.5, isActive: true },
  { id: 4, name: 'Tire Replacement', description: 'Tire removal and installation', estimatedCost: 80.00, estimatedHours: 1.5, isActive: true },
  { id: 5, name: 'Battery Replacement', description: 'Battery testing and replacement', estimatedCost: 150.00, estimatedHours: 0.5, isActive: true },
  { id: 6, name: 'Air Conditioning Repair', description: 'AC system diagnosis and repair', estimatedCost: 300.00, estimatedHours: 4.0, isActive: true },
  { id: 7, name: 'Wheel Alignment', description: 'Four-wheel alignment adjustment', estimatedCost: 75.00, estimatedHours: 1.0, isActive: true },
  { id: 8, name: 'Car Wash', description: 'Full exterior and interior cleaning', estimatedCost: 30.00, estimatedHours: 1.5, isActive: false },
  { id: 9, name: 'General Inspection', description: 'Multi-point vehicle inspection', estimatedCost: 60.00, estimatedHours: 1.0, isActive: true },
]

function getLocalData() {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try { return JSON.parse(data) } catch { /* fallback */ }
  }
  return initialServices
}

function saveLocalData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const serviceCatalogService = {
  async getAll() {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.get('/services')
    }
    return Promise.resolve(getLocalData())
  },

  async create(payload) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.post('/services', payload)
    }
    const current = getLocalData()
    const newService = {
      id: Date.now(),
      isActive: true,
      ...payload,
    }
    const updated = [newService, ...current]
    saveLocalData(updated)
    return Promise.resolve(newService)
  },

  async update(id, payload) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.put(`/services/${id}`, payload)
    }
    const current = getLocalData()
    const updated = current.map((s) => (s.id === Number(id) ? { ...s, ...payload } : s))
    saveLocalData(updated)
    return Promise.resolve({ id, ...payload })
  },

  async delete(id) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.delete(`/services/${id}`)
    }
    const current = getLocalData()
    const updated = current.filter((s) => s.id !== Number(id))
    saveLocalData(updated)
    return Promise.resolve({ success: true, id })
  },
}
