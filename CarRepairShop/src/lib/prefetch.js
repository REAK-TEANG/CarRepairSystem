import { pageLoaders } from '@/lib/pageLoaders'
import { customerService } from '@/services/customerService'
import { vehicleService } from '@/services/vehicleService'
import { mechanicService } from '@/services/mechanicService'
import { serviceCatalogService } from '@/services/serviceCatalogService'
import { repairJobService } from '@/services/repairJobService'
import { inventoryService } from '@/services/inventoryService'
import { invoiceService } from '@/services/invoiceService'
import { appointmentService } from '@/services/appointmentService'
import { employeeService } from '@/services/employeeService'
import { supplierService } from '@/services/supplierService'

const ALL = { all: true }

// Query-key root -> service, matching the hooks in src/hooks (key is [root, params]).
const LIST_SOURCES = {
  customers: customerService,
  vehicles: vehicleService,
  mechanics: mechanicService,
  services_catalog: serviceCatalogService,
  repair_jobs: repairJobService,
  inventory: inventoryService,
  invoices: invoiceService,
  appointments: appointmentService,
  employees: employeeService,
  suppliers: supplierService,
}

const LOOKUPS = ['customers', 'vehicles', 'mechanics', 'services_catalog', 'inventory']

// Per route: the page chunk to load and the shared { all: true } lists that page reads on mount.
const ROUTES = {
  '/admin/dashboard': {
    page: 'AdminDashboard',
    lists: ['invoices', 'customers', 'repair_jobs', 'inventory', 'employees', 'appointments'],
  },
  '/mechanic/dashboard': { page: 'MechanicDashboard', lists: ['mechanics', 'inventory', 'services_catalog'] },
  '/appointments': { page: 'AppointmentsPage', lists: LOOKUPS },
  '/repair-jobs': { page: 'RepairJobsPage', lists: LOOKUPS },
  '/customers': { page: 'CustomersPage', lists: [] },
  '/vehicles': { page: 'VehiclesPage', lists: ['customers', 'repair_jobs', 'mechanics', 'services_catalog', 'inventory'] },
  '/inventory': { page: 'InventoryPage', lists: ['suppliers'] },
  '/suppliers': { page: 'SuppliersPage', lists: [] },
  '/services': { page: 'ServicesPage', lists: ['inventory'] },
  '/mechanics': { page: 'MechanicsPage', lists: [] },
  '/invoices': { page: 'InvoicesPage', lists: ['invoices', 'customers', 'repair_jobs'] },
  '/employees': { page: 'EmployeesPage', lists: [] },
  '/reports': { page: 'ReportsPage', lists: ['invoices', 'repair_jobs', 'inventory'] },
  '/settings': { page: 'SettingsPage', lists: [] },
  '/audit-logs': { page: 'AuditLogsPage', lists: [] },
}

const requested = new Set()

/**
 * Warm the page chunk and its shared data lists for a route. Safe to call repeatedly:
 * chunks are fetched once per session and queries only refetch when older than the
 * client's staleTime. Failures are ignored - prefetching is best effort.
 */
export function prefetchRoute(href, queryClient) {
  const route = ROUTES[href]
  if (!route) return

  if (!requested.has(route.page)) {
    requested.add(route.page)
    pageLoaders[route.page]().catch(() => requested.delete(route.page))
  }

  for (const key of route.lists) {
    queryClient.prefetchQuery({
      queryKey: [key, ALL],
      queryFn: () => LIST_SOURCES[key].getAll(ALL),
    })
  }
}
