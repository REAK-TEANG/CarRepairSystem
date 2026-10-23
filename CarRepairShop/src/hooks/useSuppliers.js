import { supplierService } from '@/services/supplierService'
import { createEntityHooks } from '@/hooks/createEntityHooks'

const hooks = createEntityHooks({
  queryKey: 'suppliers',
  service: supplierService,
  entityName: 'Supplier',
  createOptimistic: (newSupplier) => ({
    id: Date.now(),
    rating: 5.0,
    activeOrders: 0,
    ...newSupplier,
  }),
  messages: {
    createSuccess: (data) => `Supplier "${data.name}" added`,
    updateSuccess: 'Supplier details updated',
    deleteSuccess: 'Supplier removed',
  },
})

export const useSuppliers = hooks.useList
export const useCreateSupplier = hooks.useCreate
export const useUpdateSupplier = hooks.useUpdate
export const useDeleteSupplier = hooks.useDelete

