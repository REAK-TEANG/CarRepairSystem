import { apiClient, API_CONFIG } from './apiClient'

const STORAGE_KEY = 'demo_appointments'

export const initialAppointments = [
  { id: 1, code: 'APT-001', customer: 'John Smith', customerId: 1, vehicle: 'Toyota Camry 2022', vehicleId: 1, plate: 'ABC-1234', mechanic: 'Mike Johnson', mechanicId: 1, service: 'Engine Repair', date: '2026-08-20', time: '09:00', status: 'Scheduled', notes: 'Engine knocking noise under load' },
  { id: 2, code: 'APT-002', customer: 'Sarah Davis', customerId: 2, vehicle: 'Honda Civic 2021', vehicleId: 2, plate: 'XYZ-5678', mechanic: 'Tom Wilson', mechanicId: 2, service: 'Brake Service', date: '2026-08-20', time: '10:30', status: 'Confirmed', notes: 'Squeaking brake pads' },
  { id: 3, code: 'APT-003', customer: 'Robert Lee', customerId: 3, vehicle: 'Ford F-150 2023', vehicleId: 3, plate: 'DEF-9012', mechanic: 'Mike Johnson', mechanicId: 1, service: 'Oil Change', date: '2026-08-19', time: '14:00', status: 'In Progress', notes: 'Standard synthetic 5W-30' },
  { id: 4, code: 'APT-004', customer: 'Emily Chen', customerId: 4, vehicle: 'BMW X3 2022', vehicleId: 4, plate: 'GHI-3456', mechanic: 'James Brown', mechanicId: 3, service: 'AC Repair', date: '2026-08-18', time: '11:00', status: 'Completed', notes: 'Recharged refrigerant and tested compressor' },
  { id: 5, code: 'APT-005', customer: 'David Park', customerId: 5, vehicle: 'Hyundai Sonata 2020', vehicleId: 5, plate: 'JKL-7890', mechanic: 'Tom Wilson', mechanicId: 2, service: 'Tire Replacement', date: '2026-08-21', time: '08:30', status: 'Scheduled', notes: 'Rotate and mount new Michelin tires' },
  { id: 6, code: 'APT-006', customer: 'Maria Garcia', customerId: 6, vehicle: 'Nissan Altima 2021', vehicleId: 6, plate: 'MNO-1234', mechanic: 'Mike Johnson', mechanicId: 1, service: 'General Inspection', date: '2026-08-18', time: '16:00', status: 'Cancelled', notes: 'Customer rescheduled' },
]

function getLocalData() {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try { return JSON.parse(data) } catch { /* fallback */ }
  }
  return initialAppointments
}

function saveLocalData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const appointmentService = {
  async getAll() {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.get('/appointments')
    }
    return Promise.resolve(getLocalData())
  },

  async getById(id) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.get(`/appointments/${id}`)
    }
    const current = getLocalData()
    const apt = current.find((a) => a.id === Number(id))
    return Promise.resolve(apt || null)
  },

  async create(payload) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.post('/appointments', payload)
    }
    const current = getLocalData()
    const newApt = {
      id: Date.now(),
      code: `APT-${String(current.length + 1).padStart(3, '0')}`,
      status: 'Scheduled',
      ...payload,
    }
    const updated = [newApt, ...current]
    saveLocalData(updated)
    return Promise.resolve(newApt)
  },

  async update(id, payload) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.put(`/appointments/${id}`, payload)
    }
    const current = getLocalData()
    const updated = current.map((a) => (a.id === Number(id) ? { ...a, ...payload } : a))
    saveLocalData(updated)
    return Promise.resolve({ id, ...payload })
  },

  async updateStatus(id, status) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.patch(`/appointments/${id}/status`, { status })
    }
    const current = getLocalData()
    const updated = current.map((a) => (a.id === Number(id) ? { ...a, status } : a))
    saveLocalData(updated)
    return Promise.resolve({ id, status })
  },

  async delete(id) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.delete(`/appointments/${id}`)
    }
    const current = getLocalData()
    const updated = current.filter((a) => a.id !== Number(id))
    saveLocalData(updated)
    return Promise.resolve({ success: true, id })
  },
}
