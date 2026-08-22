import { apiClient, API_CONFIG } from './apiClient'

const STORAGE_KEY = 'demo_employees'

export const initialEmployees = [
  { id: 1, employeeCode: 'EMP-001', name: 'Jane Doe', role: 'admin', roleTitle: 'System Administrator', phone: '(555) 000-1111', email: 'admin@workshop.com', hireDate: '2022-01-15', salary: 7500, attendanceStatus: 'Present', status: 'Active' },
  { id: 2, employeeCode: 'EMP-002', name: 'Marcus Vance', role: 'manager', roleTitle: 'Workshop Manager', phone: '(555) 111-2222', email: 'manager@workshop.com', hireDate: '2022-03-01', salary: 6200, attendanceStatus: 'Present', status: 'Active' },
  { id: 3, employeeCode: 'EMP-003', name: 'Sarah Jenkins', role: 'service_advisor', roleTitle: 'Service Advisor', phone: '(555) 222-3333', email: 'advisor@workshop.com', hireDate: '2023-05-10', salary: 4500, attendanceStatus: 'Present', status: 'Active' },
  { id: 4, employeeCode: 'EMP-004', name: 'Mike Johnson', role: 'mechanic', roleTitle: 'Master Technician', phone: '(555) 333-4444', email: 'mike@workshop.com', hireDate: '2022-06-20', salary: 5000, attendanceStatus: 'Present', status: 'Active' },
  { id: 5, employeeCode: 'EMP-005', name: 'Tom Wilson', role: 'mechanic', roleTitle: 'Brake Specialist', phone: '(555) 444-5555', email: 'tom@workshop.com', hireDate: '2023-01-12', salary: 4200, attendanceStatus: 'Present', status: 'Active' },
  { id: 6, employeeCode: 'EMP-006', name: 'Emily Watson', role: 'cashier', roleTitle: 'Chief Cashier', phone: '(555) 555-6666', email: 'cashier@workshop.com', hireDate: '2023-08-01', salary: 3600, attendanceStatus: 'Present', status: 'Active' },
  { id: 7, employeeCode: 'EMP-007', name: 'David Miller', role: 'storekeeper', roleTitle: 'Inventory Storekeeper', phone: '(555) 666-7777', email: 'store@workshop.com', hireDate: '2023-02-18', salary: 3800, attendanceStatus: 'Present', status: 'Active' },
]

function getLocalData() {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try { return JSON.parse(data) } catch { /* fallback */ }
  }
  return initialEmployees
}

function saveLocalData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const employeeService = {
  async getAll() {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.get('/employees')
    }
    return Promise.resolve(getLocalData())
  },

  async create(payload) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.post('/employees', payload)
    }
    const current = getLocalData()
    const newEmp = {
      id: Date.now(),
      employeeCode: `EMP-${String(current.length + 1).padStart(3, '0')}`,
      attendanceStatus: 'Present',
      status: 'Active',
      salary: Number(payload.salary) || 3500,
      hireDate: payload.hireDate || new Date().toISOString().split('T')[0],
      ...payload,
    }
    const updated = [newEmp, ...current]
    saveLocalData(updated)
    return Promise.resolve(newEmp)
  },

  async update(id, payload) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.put(`/employees/${id}`, payload)
    }
    const current = getLocalData()
    const updated = current.map((e) => (e.id === Number(id) ? { ...e, ...payload } : e))
    saveLocalData(updated)
    return Promise.resolve({ id, ...payload })
  },

  async toggleAttendance(id) {
    const current = getLocalData()
    const updated = current.map((e) => {
      if (e.id === Number(id)) {
        const nextStatus = e.attendanceStatus === 'Present' ? 'On Leave' : 'Present'
        return { ...e, attendanceStatus: nextStatus }
      }
      return e
    })
    saveLocalData(updated)
    return Promise.resolve({ id })
  },

  async delete(id) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.delete(`/employees/${id}`)
    }
    const current = getLocalData()
    const updated = current.filter((e) => e.id !== Number(id))
    saveLocalData(updated)
    return Promise.resolve({ success: true, id })
  },
}
