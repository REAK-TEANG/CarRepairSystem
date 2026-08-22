import { apiClient, API_CONFIG } from './apiClient'

const STORAGE_KEY = 'demo_mechanics'

export const initialMechanics = [
  { id: 1, code: 'MEC-001', name: 'Mike Johnson', phone: '(555) 111-2233', email: 'mike@workshop.com', specialization: 'Engine & Transmission', experience: 12, activeJobs: 3, completedJobs: 187, rating: 4.8, status: 'Active' },
  { id: 2, code: 'MEC-002', name: 'Tom Wilson', phone: '(555) 222-3344', email: 'tom@workshop.com', specialization: 'Brakes & Suspension', experience: 8, activeJobs: 2, completedJobs: 134, rating: 4.6, status: 'Active' },
  { id: 3, code: 'MEC-003', name: 'James Brown', phone: '(555) 333-4455', email: 'james@workshop.com', specialization: 'Electrical & AC', experience: 6, activeJobs: 1, completedJobs: 89, rating: 4.5, status: 'Active' },
  { id: 4, code: 'MEC-004', name: 'Carlos Rivera', phone: '(555) 444-5566', email: 'carlos@workshop.com', specialization: 'Body & Paint', experience: 10, activeJobs: 0, completedJobs: 156, rating: 4.7, status: 'On Leave' },
  { id: 5, code: 'MEC-005', name: 'Kevin Lee', phone: '(555) 555-6677', email: 'kevin@workshop.com', specialization: 'General Maintenance', experience: 3, activeJobs: 2, completedJobs: 42, rating: 4.3, status: 'Active' },
]

function getLocalData() {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try { return JSON.parse(data) } catch { /* fallback */ }
  }
  return initialMechanics
}

function saveLocalData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const mechanicService = {
  async getAll() {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.get('/mechanics')
    }
    return Promise.resolve(getLocalData())
  },

  async create(payload) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.post('/mechanics', payload)
    }
    const current = getLocalData()
    const newMechanic = {
      id: Date.now(),
      code: `MEC-${String(current.length + 1).padStart(3, '0')}`,
      activeJobs: 0,
      completedJobs: 0,
      rating: 5.0,
      status: 'Active',
      ...payload,
    }
    const updated = [newMechanic, ...current]
    saveLocalData(updated)
    return Promise.resolve(newMechanic)
  },

  async update(id, payload) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.put(`/mechanics/${id}`, payload)
    }
    const current = getLocalData()
    const updated = current.map((m) => (m.id === Number(id) ? { ...m, ...payload } : m))
    saveLocalData(updated)
    return Promise.resolve({ id, ...payload })
  },

  async delete(id) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.delete(`/mechanics/${id}`)
    }
    const current = getLocalData()
    const updated = current.filter((m) => m.id !== Number(id))
    saveLocalData(updated)
    return Promise.resolve({ success: true, id })
  },
}
