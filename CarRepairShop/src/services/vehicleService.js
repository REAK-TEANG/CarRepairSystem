import { apiClient, API_CONFIG } from './apiClient'

const STORAGE_KEY = 'demo_vehicles'

export const initialVehicles = [
  { id: 1, number: 'ABC-1234', vin: '1HGCR2F83HA001234', brand: 'Toyota', model: 'Camry', year: 2022, color: 'White', engineNumber: '2AR-FE-98765', fuelType: 'Gasoline', mileage: 45200, ownerId: 1, owner: 'John Smith' },
  { id: 2, number: 'XYZ-5678', vin: '2HGFC2F58HH005678', brand: 'Honda', model: 'Civic', year: 2021, color: 'Black', engineNumber: 'L15BA-12345', fuelType: 'Gasoline', mileage: 32100, ownerId: 2, owner: 'Sarah Davis' },
  { id: 3, number: 'DEF-9012', vin: '1FTFW1ED4MFA09012', brand: 'Ford', model: 'F-150', year: 2023, color: 'Blue', engineNumber: 'ECO-V6-44332', fuelType: 'Gasoline', mileage: 18500, ownerId: 3, owner: 'Robert Lee' },
  { id: 4, number: 'GHI-3456', vin: '5UXTY5C03N9B03456', brand: 'BMW', model: 'X3', year: 2022, color: 'Silver', engineNumber: 'B48-87654', fuelType: 'Gasoline', mileage: 28900, ownerId: 4, owner: 'Emily Chen' },
  { id: 5, number: 'JKL-7890', vin: '5NPE24AF9LH007890', brand: 'Hyundai', model: 'Sonata', year: 2020, color: 'Gray', engineNumber: 'G4NG-54321', fuelType: 'Hybrid', mileage: 61300, ownerId: 5, owner: 'David Park' },
]

function getLocalData() {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try { return JSON.parse(data) } catch { /* fallback */ }
  }
  return initialVehicles
}

function saveLocalData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const vehicleService = {
  async getAll() {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.get('/vehicles')
    }
    return Promise.resolve(getLocalData())
  },

  async getById(id) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.get(`/vehicles/${id}`)
    }
    const current = getLocalData()
    const vehicle = current.find((v) => v.id === Number(id))
    return Promise.resolve(vehicle || null)
  },

  async create(payload) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.post('/vehicles', payload)
    }
    const current = getLocalData()
    const newVehicle = {
      id: Date.now(),
      mileage: Number(payload.mileage) || 0,
      ...payload,
    }
    const updated = [newVehicle, ...current]
    saveLocalData(updated)
    return Promise.resolve(newVehicle)
  },

  async update(id, payload) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.put(`/vehicles/${id}`, payload)
    }
    const current = getLocalData()
    const updated = current.map((v) => (v.id === Number(id) ? { ...v, ...payload } : v))
    saveLocalData(updated)
    return Promise.resolve({ id, ...payload })
  },

  async delete(id) {
    if (API_CONFIG.USE_REAL_API) {
      return apiClient.delete(`/vehicles/${id}`)
    }
    const current = getLocalData()
    const updated = current.filter((v) => v.id !== Number(id))
    saveLocalData(updated)
    return Promise.resolve({ success: true, id })
  },
}
