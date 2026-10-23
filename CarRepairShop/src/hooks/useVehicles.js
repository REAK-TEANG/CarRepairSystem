import { vehicleService } from '@/services/vehicleService'
import { createEntityHooks } from '@/hooks/createEntityHooks'

const hooks = createEntityHooks({
  queryKey: 'vehicles',
  service: vehicleService,
  entityName: 'Vehicle',
  createOptimistic: (newVehicle) => ({
    id: Date.now(),
    mileage: Number(newVehicle.mileage) || 0,
    ...newVehicle,
  }),
  messages: {
    createSuccess: (data) => `Vehicle ${data.number} registered`,
    updateSuccess: (data) => `Vehicle ${data.number} updated`,
    deleteSuccess: 'Vehicle removed from registry',
  },
})

export const useVehicles = hooks.useList
export const useCreateVehicle = hooks.useCreate
export const useUpdateVehicle = hooks.useUpdate
export const useDeleteVehicle = hooks.useDelete

