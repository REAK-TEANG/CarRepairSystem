import { mechanicService } from '@/services/mechanicService'
import { createEntityHooks } from '@/hooks/createEntityHooks'

const hooks = createEntityHooks({
  queryKey: 'mechanics',
  service: mechanicService,
  entityName: 'Mechanic',
  createOptimistic: (newMechanic, previous) => ({
    id: Date.now(),
    code: `MEC-${String(previous.length + 1).padStart(3, '0')}`,
    activeJobs: 0,
    completedJobs: 0,
    rating: 5.0,
    status: 'Active',
    ...newMechanic,
  }),
  messages: {
    createSuccess: (data) => `Mechanic "${data.name}" added to roster`,
    updateSuccess: 'Mechanic profile updated',
    deleteSuccess: 'Mechanic removed from roster',
  },
})

export const useMechanics = hooks.useList
export const useCreateMechanic = hooks.useCreate
export const useUpdateMechanic = hooks.useUpdate
export const useDeleteMechanic = hooks.useDelete

