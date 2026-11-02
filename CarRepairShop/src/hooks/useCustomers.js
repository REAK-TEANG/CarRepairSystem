import { customerService } from '@/services/customerService'
import { createEntityHooks } from '@/hooks/createEntityHooks'

const hooks = createEntityHooks({
  queryKey: 'customers',
  service: customerService,
  entityName: 'Customer',
  createOptimistic: (newCustomer, previous = []) => ({
    id: Date.now(),
    code: `CUST-${String((previous?.length || 0) + 1).padStart(3, '0')}`,
    registrationDate: new Date().toISOString().split('T')[0],
    vehiclesCount: 0,
    totalSpent: '$0.00',
    ...newCustomer,
  }),
  messages: {
    createSuccess: (data) => `Customer "${data.name}" added`,
    updateSuccess: 'Customer details updated',
    deleteSuccess: 'Customer deleted',
  },
})

export const useCustomers = hooks.useList
export const useCreateCustomer = hooks.useCreate
export const useUpdateCustomer = hooks.useUpdate
export const useDeleteCustomer = hooks.useDelete

