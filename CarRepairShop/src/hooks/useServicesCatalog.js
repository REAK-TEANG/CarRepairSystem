import { serviceCatalogService } from '@/services/serviceCatalogService'
import { createEntityHooks } from '@/hooks/createEntityHooks'

const hooks = createEntityHooks({
  queryKey: 'services_catalog',
  service: serviceCatalogService,
  entityName: 'Service',
  createOptimistic: (newService) => ({
    id: Date.now(),
    isActive: true,
    ...newService,
  }),
  messages: {
    createSuccess: (data) => `Service "${data.name}" added to catalog`,
    updateSuccess: 'Service catalog item updated',
    deleteSuccess: 'Service deleted from catalog',
  },
})

export const useServicesCatalog = hooks.useList
export const useCreateService = hooks.useCreate
export const useUpdateService = hooks.useUpdate
export const useDeleteService = hooks.useDelete

