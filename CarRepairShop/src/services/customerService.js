import { apiClient, API_CONFIG } from './apiClient'

const STORAGE_KEY = 'demo_customers'

export const initialCustomers = [
  { id: 1, code: 'CUS-001', name: 'John Smith', phone: '(555) 123-4567', email: 'john@email.com', address: '124 Elm St, Cityville', vehiclesCount: 2, totalSpent: '$4,250', registrationDate: '2024-03-15', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
  { id: 2, code: 'CUS-002', name: 'Sarah Davis', phone: '(555) 234-5678', email: 'sarah@email.com', address: '456 Oak Rd, Metro', vehiclesCount: 1, totalSpent: '$1,800', registrationDate: '2024-05-20', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80' },
  { id: 3, code: 'CUS-003', name: 'Robert Lee', phone: '(555) 345-6789', email: 'robert@email.com', address: '789 Pine Ave, Westland', vehiclesCount: 3, totalSpent: '$7,500', registrationDate: '2024-01-10', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
  { id: 4, code: 'CUS-004', name: 'Emily Chen', phone: '(555) 456-7890', email: 'emily@email.com', address: '321 Maple Dr, Eastwood', vehiclesCount: 1, totalSpent: '$950', registrationDate: '2024-07-08', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
  { id: 5, code: 'CUS-005', name: 'David Park', phone: '(555) 567-8901', email: 'david@email.com', address: '654 Birch Ln, Northridge', vehiclesCount: 2, totalSpent: '$3,100', registrationDate: '2024-02-28', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
]

function getLocalData() {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try { return JSON.parse(data) } catch { /* fallback */ }
  }
  return initialCustomers
}

function saveLocalData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const customerService = {
  async getAll() {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.get('/customers')
    }
    return Promise.resolve(getLocalData())
  },

  async getById(id) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.get(`/customers/${id}`)
    }
    const current = getLocalData()
    const customer = current.find((c) => c.id === Number(id))
    return Promise.resolve(customer || null)
  },

  async create(payload) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.post('/customers', payload)
    }
    const current = getLocalData()
    const newCustomer = {
      id: Date.now(),
      code: `CUS-${String(current.length + 1).padStart(3, '0')}`,
      registrationDate: new Date().toISOString().split('T')[0],
      vehiclesCount: 0,
      totalSpent: '$0.00',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      ...payload,
    }
    const updated = [newCustomer, ...current]
    saveLocalData(updated)
    return Promise.resolve(newCustomer)
  },

  async update(id, payload) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.put(`/customers/${id}`, payload)
    }
    const current = getLocalData()
    const updated = current.map((c) => (c.id === Number(id) ? { ...c, ...payload } : c))
    saveLocalData(updated)
    return Promise.resolve({ id, ...payload })
  },

  async delete(id) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.delete(`/customers/${id}`)
    }
    const current = getLocalData()
    const updated = current.filter((c) => c.id !== Number(id))
    saveLocalData(updated)
    return Promise.resolve({ success: true, id })
  },
}
