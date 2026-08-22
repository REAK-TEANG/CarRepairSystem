import { apiClient, API_CONFIG } from './apiClient'

const STORAGE_KEY = 'demo_repair_jobs'

export const initialRepairJobs = [
  { id: 1, orderNumber: 'RO-2026-0042', customer: 'John Smith', customerId: 1, vehicle: 'Toyota Camry 2022', vehicleId: 1, plate: 'ABC-1234', mechanic: 'Mike Johnson', mechanicId: 4, problem: 'Engine overheating', diagnosis: 'Faulty thermostat and coolant leak at lower hose', estimatedCost: '$850', actualCost: '$820', status: 'Repairing', createdAt: '2026-08-16' },
  { id: 2, orderNumber: 'RO-2026-0041', customer: 'Sarah Davis', customerId: 2, vehicle: 'Honda Civic 2021', vehicleId: 2, plate: 'XYZ-5678', mechanic: 'Tom Wilson', mechanicId: 5, problem: 'Brake noise', diagnosis: 'Front ceramic brake pads worn to 2mm', estimatedCost: '$320', actualCost: '$310', status: 'Diagnosing', createdAt: '2026-08-16' },
  { id: 3, orderNumber: 'RO-2026-0040', customer: 'Robert Lee', customerId: 3, vehicle: 'Ford F-150 2023', vehicleId: 3, plate: 'DEF-9012', mechanic: 'Mike Johnson', mechanicId: 4, problem: 'Transmission issue', diagnosis: 'Solenoid pack failure on 3rd gear shift', estimatedCost: '$1,200', actualCost: null, status: 'Waiting for Parts', createdAt: '2026-08-15' },
  { id: 4, orderNumber: 'RO-2026-0039', customer: 'Emily Chen', customerId: 4, vehicle: 'BMW X3 2022', vehicleId: 4, plate: 'GHI-3456', mechanic: 'James Brown', mechanicId: 3, problem: 'AC not cooling', diagnosis: 'Expansion valve clogged', estimatedCost: '$450', actualCost: '$440', status: 'Ready for Pickup', createdAt: '2026-08-14' },
  { id: 5, orderNumber: 'RO-2026-0038', customer: 'David Park', customerId: 5, vehicle: 'Hyundai Sonata 2020', vehicleId: 5, plate: 'JKL-7890', mechanic: 'Tom Wilson', mechanicId: 5, problem: 'Oil change + inspection', diagnosis: 'Routine scheduled 60k service', estimatedCost: '$110', actualCost: '$110', status: 'Completed', createdAt: '2026-08-14' },
]

function getLocalData() {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try { return JSON.parse(data) } catch { /* fallback */ }
  }
  return initialRepairJobs
}

function saveLocalData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const repairJobService = {
  async getAll(params = {}) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.get('/repair-orders', { params })
    }
    const current = getLocalData()
    if (params.mechanicId) {
      return Promise.resolve(current.filter((j) => j.mechanicId === Number(params.mechanicId)))
    }
    return Promise.resolve(current)
  },

  async getById(id) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.get(`/repair-orders/${id}`)
    }
    const current = getLocalData()
    const job = current.find((j) => j.id === Number(id))
    return Promise.resolve(job || null)
  },

  async create(payload) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.post('/repair-orders', payload)
    }
    const current = getLocalData()
    const newJob = {
      id: Date.now(),
      orderNumber: `RO-2026-${String(current.length + 1).padStart(4, '0')}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Pending',
      ...payload,
    }
    const updated = [newJob, ...current]
    saveLocalData(updated)
    return Promise.resolve(newJob)
  },

  async update(id, payload) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.put(`/repair-orders/${id}`, payload)
    }
    const current = getLocalData()
    const updated = current.map((j) => (j.id === Number(id) ? { ...j, ...payload } : j))
    saveLocalData(updated)
    return Promise.resolve({ id, ...payload })
  },

  async updateStatus(id, status) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.patch(`/repair-orders/${id}/status`, { status })
    }
    const current = getLocalData()
    const updated = current.map((j) => (j.id === Number(id) ? { ...j, status } : j))
    saveLocalData(updated)
    return Promise.resolve({ id, status })
  },

  async delete(id) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.delete(`/repair-orders/${id}`)
    }
    const current = getLocalData()
    const updated = current.filter((j) => j.id !== Number(id))
    saveLocalData(updated)
    return Promise.resolve({ success: true, id })
  },
}
