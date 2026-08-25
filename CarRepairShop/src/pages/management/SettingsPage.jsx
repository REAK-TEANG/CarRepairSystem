import { useState, useEffect, useMemo } from 'react'
import {
  FloppyDisk,
  Database,
  Gear,
  ShieldCheck,
  LockKey,
  Users,
  CheckCircle,
  ArrowCounterClockwise,
  Check,
  Shield,
  Car,
  CalendarBlank,
  Wrench,
  Package,
  Buildings,
  Toolbox,
  UserGear,
  FileText,
  IdentificationBadge,
  ChartLine,
  Phone,
  EnvelopeSimple,
  Clock,
  MapPin,
  CurrencyDollar,
  DownloadSimple,
  UploadSimple,
  MagnifyingGlass,
  Receipt,
  Sparkle,
  WarningCircle,
  Translate,
} from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { settingsService, initialWorkshopSettings } from '../../services/settingsService'
import { useAuth, DEFAULT_PERMISSIONS_MATRIX } from '../../context/AuthContext'
import { LanguageSwitcher } from '../../components/ui'

const MODULE_DEFINITIONS = [
  // Operations Category
  {
    key: 'customers',
    titleKey: 'titles.customerDirectory',
    category: 'Operations',
    icon: Users,
    desc: 'Manage customer profiles, vehicles, and contact history',
  },
  {
    key: 'vehicles',
    titleKey: 'titles.vehicleRegistry',
    category: 'Operations',
    icon: Car,
    desc: 'Manage license plates, models, VINs, and service logs',
  },
  {
    key: 'appointments',
    titleKey: 'titles.appointmentsSchedule',
    category: 'Operations',
    icon: CalendarBlank,
    desc: 'Booking calendar, customer scheduling, and time slots',
  },
  {
    key: 'repair_jobs',
    titleKey: 'titles.repairJobsOrders',
    category: 'Operations',
    icon: Wrench,
    desc: 'Workshop job cards, diagnostics stages, and task assignments',
  },

  // Workshop & Supply Category
  {
    key: 'inventory',
    titleKey: 'titles.sparePartsInventory',
    category: 'Workshop & Supply',
    icon: Package,
    desc: 'Stock quantities, part codes, cost tracking, and stock in/out',
  },
  {
    key: 'suppliers',
    titleKey: 'titles.suppliersProcurement',
    category: 'Workshop & Supply',
    icon: Buildings,
    desc: 'Parts vendor accounts, contact info, and purchase orders',
  },
  {
    key: 'services',
    titleKey: 'titles.serviceCatalog',
    category: 'Workshop & Supply',
    icon: Toolbox,
    desc: 'Standard labor packages, diagnostic fees, and flat rates',
  },
  {
    key: 'mechanics',
    titleKey: 'titles.mechanicsStaffRoster',
    category: 'Workshop & Supply',
    icon: UserGear,
    desc: 'Staff mechanics roster, specialties, and active workloads',
  },

  // Management Category
  {
    key: 'invoices',
    titleKey: 'titles.invoicesBilling',
    category: 'Management',
    icon: FileText,
    desc: 'Billing generation, receipt printing, and payment settlement',
  },
  {
    key: 'employees',
    titleKey: 'titles.staffAttendance',
    category: 'Management',
    icon: IdentificationBadge,
    desc: 'Employee payroll, roles, contact cards, and shift attendance',
  },
  {
    key: 'reports',
    titleKey: 'titles.analyticsReports',
    category: 'Management',
    icon: ChartLine,
    desc: 'Workshop performance metrics, revenue charts, and CSV export',
  },
  {
    key: 'settings',
    titleKey: 'titles.systemSettings',
    category: 'Management',
    icon: Gear,
    desc: 'System parameters, tax configurations, and security matrix',
  },
]

const EDITABLE_ROLES = [
  {
    role: 'manager',
    roleKey: 'roles.manager',
    desc: 'Full operational & staff supervision',
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    avatarBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  },
  {
    role: 'service_advisor',
    roleKey: 'roles.service_advisor',
    desc: 'Appointments, customer intake & billing',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    avatarBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  {
    role: 'mechanic',
    roleKey: 'roles.mechanic',
    desc: 'Repair execution & vehicle inspection',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    avatarBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  {
    role: 'cashier',
    roleKey: 'roles.cashier',
    desc: 'Invoices, payments & customer checkout',
    badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    avatarBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  },
  {
    role: 'storekeeper',
    roleKey: 'roles.storekeeper',
    desc: 'Spare parts stock, inventory & suppliers',
    badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    avatarBg: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
  },
]

const PERM_ACTIONS = [
  { key: 'read', label: 'View / Read', short: 'Read', desc: 'Can view records and lists' },
  { key: 'create', label: 'Create / Add', short: 'Create', desc: 'Can create new records' },
  { key: 'update', label: 'Edit / Update', short: 'Edit', desc: 'Can modify existing records' },
  { key: 'delete', label: 'Delete / Remove', short: 'Delete', desc: 'Can delete or archive records', danger: true },
]

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { user, permissionsMatrix, savePermissionsMatrix, resetPermissionsToDefault } = useAuth()

  const [activeTab, setActiveTab] = useState('permissions') // 'permissions' | 'profile' | 'billing' | 'language' | 'security'
  const [selectedRole, setSelectedRole] = useState('manager')
  const [localMatrix, setLocalMatrix] = useState(permissionsMatrix)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const [settings, setSettings] = useState({
    shopName: '',
    taxRate: 8.5,
    currency: 'USD ($)',
    businessHours: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    autoBackupDaily: true,
  })

  const [saved, setSaved] = useState(false)
  const [permSaved, setPermSaved] = useState(false)
  const [isSavingPerms, setIsSavingPerms] = useState(false)
  const [importStatus, setImportStatus] = useState(null)

  useEffect(() => {
    settingsService.getSettings().then((data) => {
      if (data) {
        setSettings({
          shopName: data.shopName || initialWorkshopSettings.shopName,
          taxRate: data.taxRate ?? initialWorkshopSettings.taxRate,
          currency: data.currency || initialWorkshopSettings.currency,
          businessHours: data.businessHours || initialWorkshopSettings.businessHours,
          contactPhone: data.contactPhone || initialWorkshopSettings.contactPhone,
          contactEmail: data.contactEmail || initialWorkshopSettings.contactEmail,
          address: data.address || initialWorkshopSettings.address,
          autoBackupDaily: data.autoBackupDaily ?? true,
        })
      }
    })
  }, [])

  useEffect(() => {
    setLocalMatrix(permissionsMatrix)
  }, [permissionsMatrix])

  // Detect unsaved changes in permissions
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(localMatrix) !== JSON.stringify(permissionsMatrix)
  }, [localMatrix, permissionsMatrix])

  const handleSettingsSubmit = (e) => {
    e?.preventDefault()
    settingsService.updateSettings(settings).then(() => {
      setSaved(true)
      setTimeout(() => setSaved(false), 3500)
    })
  }

  const handleToggleLocalPerm = (role, moduleKey, action) => {
    if (role === 'admin') return

    setLocalMatrix((prev) => {
      const currentModule = prev[moduleKey] || {}
      const currentRolePerms = currentModule[role] || []
      const hasAction = currentRolePerms.includes(action)

      let updatedRolePerms
      if (hasAction) {
        updatedRolePerms = currentRolePerms.filter((a) => a !== action)
      } else {
        updatedRolePerms = [...currentRolePerms, action]
      }

      return {
        ...prev,
        [moduleKey]: {
          ...currentModule,
          [role]: updatedRolePerms,
        },
      }
    })
  }

  const handleToggleActionColumn = (role, action) => {
    if (role === 'admin') return

    const allChecked = MODULE_DEFINITIONS.every((mod) => (localMatrix[mod.key]?.[role] || []).includes(action))

    setLocalMatrix((prev) => {
      const next = { ...prev }
      MODULE_DEFINITIONS.forEach((mod) => {
        const currentModule = next[mod.key] || {}
        const currentRolePerms = currentModule[role] || []

        let updated
        if (allChecked) {
          updated = currentRolePerms.filter((a) => a !== action)
        } else {
          updated = currentRolePerms.includes(action) ? currentRolePerms : [...currentRolePerms, action]
        }

        next[mod.key] = {
          ...currentModule,
          [role]: updated,
        }
      })
      return next
    })
  }

  const handleSetRowPreset = (role, moduleKey, preset) => {
    if (role === 'admin') return

    setLocalMatrix((prev) => {
      const currentModule = prev[moduleKey] || {}
      let updatedRolePerms = []

      if (preset === 'full') {
        updatedRolePerms = ['read', 'create', 'update', 'delete']
      } else if (preset === 'read') {
        updatedRolePerms = ['read']
      } else if (preset === 'write') {
        updatedRolePerms = ['read', 'create', 'update']
      } else if (preset === 'none') {
        updatedRolePerms = []
      }

      return {
        ...prev,
        [moduleKey]: {
          ...currentModule,
          [role]: updatedRolePerms,
        },
      }
    })
  }

  const handleGrantAll = (role) => {
    if (role === 'admin') return
    setLocalMatrix((prev) => {
      const next = { ...prev }
      MODULE_DEFINITIONS.forEach((mod) => {
        if (!next[mod.key]) next[mod.key] = {}
        next[mod.key][role] = ['read', 'create', 'update', 'delete']
      })
      return next
    })
  }

  const handleRevokeAll = (role) => {
    if (role === 'admin') return
    setLocalMatrix((prev) => {
      const next = { ...prev }
      MODULE_DEFINITIONS.forEach((mod) => {
        if (!next[mod.key]) next[mod.key] = {}
        next[mod.key][role] = []
      })
      return next
    })
  }

  const handleSetReadOnly = (role) => {
    if (role === 'admin') return
    setLocalMatrix((prev) => {
      const next = { ...prev }
      MODULE_DEFINITIONS.forEach((mod) => {
        if (!next[mod.key]) next[mod.key] = {}
        next[mod.key][role] = ['read']
      })
      return next
    })
  }

  const handleSavePermissions = async () => {
    setIsSavingPerms(true)
    await savePermissionsMatrix(localMatrix)
    setIsSavingPerms(false)
    setPermSaved(true)
    setTimeout(() => setPermSaved(false), 3500)
  }

  const handleDiscardChanges = () => {
    setLocalMatrix(permissionsMatrix)
  }

  const handleResetDefaults = async () => {
    if (window.confirm('Reset all role permissions to the factory default matrix?')) {
      await resetPermissionsToDefault()
      setLocalMatrix(DEFAULT_PERMISSIONS_MATRIX)
      setPermSaved(true)
      setTimeout(() => setPermSaved(false), 3500)
    }
  }

  // Filter modules by search and category
  const filteredModules = useMemo(() => {
    return MODULE_DEFINITIONS.filter((mod) => {
      const label = t(mod.titleKey)
      const matchesSearch =
        !searchQuery ||
        label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.desc.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCat = selectedCategory === 'All' || mod.category === selectedCategory
      return matchesSearch && matchesCat
    })
  }, [searchQuery, selectedCategory, t])

  // Count active permissions for selected role
  const roleStats = useMemo(() => {
    let totalGranted = 0
    let readCount = 0
    let writeCount = 0
    let deleteCount = 0

    MODULE_DEFINITIONS.forEach((mod) => {
      const perms = localMatrix[mod.key]?.[selectedRole] || []
      totalGranted += perms.length
      if (perms.includes('read')) readCount++
      if (perms.includes('create') || perms.includes('update')) writeCount++
      if (perms.includes('delete')) deleteCount++
    })

    const maxPerms = MODULE_DEFINITIONS.length * 4
    const percentage = Math.round((totalGranted / maxPerms) * 100)

    return { totalGranted, maxPerms, percentage, readCount, writeCount, deleteCount }
  }, [localMatrix, selectedRole])

  // JSON Import Handler
  const handleImportConfig = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result)
        if (parsed.settings) {
          setSettings(parsed.settings)
          await settingsService.updateSettings(parsed.settings)
        }
        if (parsed.permissionsMatrix) {
          setLocalMatrix(parsed.permissionsMatrix)
          await savePermissionsMatrix(parsed.permissionsMatrix)
        }
        setImportStatus({ type: 'success', message: 'Backup configuration imported successfully!' })
        setTimeout(() => setImportStatus(null), 4000)
      } catch (err) {
        setImportStatus({ type: 'error', message: 'Invalid JSON configuration file.' })
        setTimeout(() => setImportStatus(null), 4000)
      }
    }
    reader.readAsText(file)
  }

  const activeRoleObj = EDITABLE_ROLES.find((r) => r.role === selectedRole)

  return (
    <div className="space-y-6 text-app-text font-sans max-w-6xl mx-auto pb-16 transition-colors duration-200">
      {/* Top Header & Page Identity */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-app-card border border-app-border rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-app-accent/15 border border-app-accent/30 flex items-center justify-center text-app-accent flex-shrink-0 shadow-subtle">
            <Gear size={26} weight="duotone" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-app-text">{t('titles.systemSettings')}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Live System
              </span>
            </div>
            <p className="text-xs text-app-muted mt-0.5">{t('settings.subtitle')}</p>
          </div>
        </div>

        {/* Global Quick Action Stats */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 px-3.5 py-2 bg-app-hover/60 border border-app-border rounded-xl text-xs">
            <div className="text-right">
              <p className="text-[10px] text-app-muted uppercase font-bold tracking-wider">Access Model</p>
              <p className="font-semibold text-app-text font-mono">RBAC Matrix (v2)</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-app-border">
        {user?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'permissions'
                ? 'bg-app-accent text-app-accentText shadow-subtle'
                : 'text-app-muted hover:text-app-text hover:bg-app-hover'
            }`}
          >
            <LockKey size={16} weight={activeTab === 'permissions' ? 'bold' : 'regular'} />
            {t('settings.rbacMatrix')}
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold uppercase ml-1">
              Admin
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'profile'
              ? 'bg-app-accent text-app-accentText shadow-subtle'
              : 'text-app-muted hover:text-app-text hover:bg-app-hover'
          }`}
        >
          <Buildings size={16} weight={activeTab === 'profile' ? 'bold' : 'regular'} />
          {t('settings.workshopProfile')}
        </button>

        <button
          onClick={() => setActiveTab('language')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'language'
              ? 'bg-app-accent text-app-accentText shadow-subtle'
              : 'text-app-muted hover:text-app-text hover:bg-app-hover'
          }`}
        >
          <Translate size={16} weight={activeTab === 'language' ? 'bold' : 'regular'} />
          {t('settings.language')}
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'billing'
              ? 'bg-app-accent text-app-accentText shadow-subtle'
              : 'text-app-muted hover:text-app-text hover:bg-app-hover'
          }`}
        >
          <Receipt size={16} weight={activeTab === 'billing' ? 'bold' : 'regular'} />
          {t('settings.taxDefaults')}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'security'
              ? 'bg-app-accent text-app-accentText shadow-subtle'
              : 'text-app-muted hover:text-app-text hover:bg-app-hover'
          }`}
        >
          <Database size={16} weight={activeTab === 'security' ? 'bold' : 'regular'} />
          {t('settings.dataSafety')}
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: ROLE PERMISSIONS MATRIX (RBAC)                        */}
      {/* ============================================================ */}
      {activeTab === 'permissions' && (
        <div className="space-y-6 animate-fade-in">
          {/* Notification Banners */}
          {permSaved && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle size={18} weight="fill" className="text-emerald-500" />
                <span>{t('settings.permsSynced')}</span>
              </div>
              <span className="text-[11px] font-mono opacity-80">{t('settings.savedJustNow')}</span>
            </div>
          )}

          {/* Admin Safe Banner */}
          <div className="p-4 bg-app-card border border-app-border rounded-2xl shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 flex-shrink-0">
                <Shield size={22} weight="duotone" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-app-text">{t('roles.admin')} (Root Authority)</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                    100% Unrestricted Access
                  </span>
                </div>
                <p className="text-[11px] text-app-muted mt-0.5">{t('settings.adminDesc')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-app-hover hover:bg-app-border rounded-xl text-xs text-app-muted hover:text-app-text transition-colors"
                title="Reset matrix to factory defaults"
              >
                <ArrowCounterClockwise size={14} weight="bold" />
                {t('settings.factoryReset')}
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={isSavingPerms}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-xl text-xs transition-colors shadow-subtle disabled:opacity-50"
              >
                {isSavingPerms ? <span className="inline-block animate-spin mr-1">⟳</span> : <FloppyDisk size={15} weight="bold" />}
                {t('settings.savePermissions')}
              </button>
            </div>
          </div>

          {/* Role Cards Switcher */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-app-muted uppercase tracking-wider">{t('settings.selectRoleToConfig')}:</label>
                <p className="text-[11px] text-app-muted">{t('settings.selectRoleDesc')}</p>
              </div>

              {/* Quick Presets for Selected Role */}
              <div className="flex items-center gap-1.5 bg-app-card border border-app-border p-1 rounded-xl shadow-subtle text-xs self-start sm:self-auto">
                <button
                  onClick={() => handleGrantAll(selectedRole)}
                  className="px-2.5 py-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-[11px] font-semibold transition-colors flex items-center gap-1"
                >
                  <Sparkle size={12} weight="bold" />
                  {t('settings.grantAll')}
                </button>
                <span className="text-app-border">|</span>
                <button
                  onClick={() => handleSetReadOnly(selectedRole)}
                  className="px-2.5 py-1 rounded-lg text-app-muted hover:text-app-text hover:bg-app-hover text-[11px] font-medium transition-colors"
                >
                  {t('settings.readOnly')}
                </button>
                <span className="text-app-border">|</span>
                <button
                  onClick={() => handleRevokeAll(selectedRole)}
                  className="px-2.5 py-1 rounded-lg text-rose-500 hover:bg-rose-500/10 text-[11px] font-medium transition-colors"
                >
                  {t('settings.revokeAll')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {EDITABLE_ROLES.map((r) => {
                const isSelected = selectedRole === r.role
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setSelectedRole(r.role)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-app-card border-app-accent shadow-md ring-2 ring-app-accent/20'
                        : 'bg-app-card border-app-border hover:border-app-muted/50 hover:bg-app-hover/50'
                    }`}
                  >
                    <div>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border mb-2 ${r.badge}`}>
                        {t(r.roleKey)}
                      </span>
                      <p className="font-bold text-xs text-app-text mt-0.5">{t(r.roleKey)}</p>
                      <p className="text-[10px] text-app-muted mt-0.5 line-clamp-1">{r.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-app-card rounded-2xl border border-app-border shadow-card overflow-hidden">
            <div className="p-4 border-b border-app-border flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                <input
                  type="text"
                  placeholder={t('common.quickSearch')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-app-input border border-app-border rounded-xl text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent transition-colors"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-app-muted text-left border-b border-app-border bg-app-hover/50">
                    <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px]">{t('settings.moduleName')}</th>
                    {PERM_ACTIONS.map((a) => (
                      <th key={a.key} className="px-3 py-3.5 text-center w-24 font-bold uppercase tracking-wider text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleToggleActionColumn(selectedRole, a.key)}
                          className="hover:text-app-text transition-colors inline-flex items-center gap-1"
                        >
                          {a.short}
                        </button>
                      </th>
                    ))}
                    <th className="px-4 py-3.5 text-center w-28 font-bold uppercase tracking-wider text-[10px]">{t('settings.quickPresets')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {filteredModules.map((mod) => {
                    const Icon = mod.icon
                    const rolePerms = localMatrix[mod.key]?.[selectedRole] || []
                    const isAllChecked = PERM_ACTIONS.every((a) => rolePerms.includes(a.key))
                    const isNoneChecked = rolePerms.length === 0

                    return (
                      <tr key={mod.key} className="hover:bg-app-hover/50 transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-app-hover border border-app-border flex items-center justify-center text-app-muted group-hover:text-app-accent group-hover:border-app-accent/30 transition-colors flex-shrink-0">
                              <Icon size={18} weight="regular" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-app-text">{t(mod.titleKey)}</p>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-app-hover text-app-muted border border-app-border">
                                  {mod.category}
                                </span>
                              </div>
                              <p className="text-[11px] text-app-muted mt-0.5">{mod.desc}</p>
                            </div>
                          </div>
                        </td>

                        {PERM_ACTIONS.map((action) => {
                          const isChecked = rolePerms.includes(action.key)
                          return (
                            <td key={action.key} className="px-3 py-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleLocalPerm(selectedRole, mod.key, action.key)}
                                className={`w-6 h-6 rounded-lg border inline-flex items-center justify-center transition-all ${
                                  isChecked
                                    ? action.danger
                                      ? 'bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-400'
                                      : 'bg-emerald-500 text-white dark:bg-emerald-500 dark:text-gray-900 border-emerald-500 shadow-sm'
                                    : 'border-app-border bg-app-input hover:border-app-muted/60 text-transparent'
                                }`}
                              >
                                <Check size={14} weight="bold" />
                              </button>
                            </td>
                          )
                        })}

                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex items-center gap-1 bg-app-hover/70 border border-app-border p-0.5 rounded-lg text-[10px]">
                            <button
                              onClick={() => handleSetRowPreset(selectedRole, mod.key, 'full')}
                              className={`px-1.5 py-0.5 rounded ${
                                isAllChecked ? 'bg-app-card text-app-text font-bold shadow-subtle' : 'text-app-muted hover:text-app-text'
                              }`}
                            >
                              {t('settings.full')}
                            </button>
                            <button
                              onClick={() => handleSetRowPreset(selectedRole, mod.key, 'read')}
                              className={`px-1.5 py-0.5 rounded ${
                                rolePerms.length === 1 && rolePerms[0] === 'read'
                                  ? 'bg-app-card text-app-text font-bold shadow-subtle'
                                  : 'text-app-muted hover:text-app-text'
                              }`}
                            >
                              {t('settings.read')}
                            </button>
                            <button
                              onClick={() => handleSetRowPreset(selectedRole, mod.key, 'none')}
                              className={`px-1.5 py-0.5 rounded ${
                                isNoneChecked ? 'bg-app-card text-rose-500 font-bold shadow-subtle' : 'text-app-muted hover:text-rose-500'
                              }`}
                            >
                              {t('settings.off')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-app-border bg-app-hover/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] text-app-muted">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{t('settings.changesInMemory')}</span>
              </div>

              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <button
                    onClick={handleDiscardChanges}
                    className="px-3.5 py-2 rounded-xl border border-app-border bg-app-card text-app-muted hover:text-app-text text-xs font-medium transition-colors"
                  >
                    {t('settings.discard')}
                  </button>
                )}
                <button
                  onClick={handleSavePermissions}
                  disabled={isSavingPerms}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-xl text-xs transition-colors shadow-subtle disabled:opacity-50"
                >
                  <FloppyDisk size={15} weight="bold" />
                  {t('settings.savePermissions')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: WORKSHOP PROFILE & IDENTITY                           */}
      {/* ============================================================ */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSettingsSubmit} className="space-y-6 animate-fade-in">
          {saved && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in">
              <ShieldCheck size={18} weight="bold" />
              {t('settings.profileUpdated')}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-app-card rounded-2xl border border-app-border p-6 shadow-card space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-app-border">
                  <Buildings size={18} className="text-app-accent" weight="bold" />
                  <h2 className="text-sm font-bold text-app-text">{t('settings.workshopIdentity')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="md:col-span-2">
                    <label className="block text-app-muted font-semibold mb-1.5">{t('settings.workshopName')}</label>
                    <div className="relative">
                      <Buildings size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                      <input
                        type="text"
                        value={settings.shopName}
                        onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
                        placeholder="e.g. Precision Auto Works"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-app-muted font-semibold mb-1.5">{t('settings.phone')}</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                      <input
                        type="text"
                        value={settings.contactPhone}
                        onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent font-mono"
                        placeholder="+855 12 345 678"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-app-muted font-semibold mb-1.5">{t('settings.email')}</label>
                    <div className="relative">
                      <EnvelopeSimple size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                      <input
                        type="email"
                        value={settings.contactEmail}
                        onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
                        placeholder="service@autoworkshop.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-app-muted font-semibold mb-1.5">{t('settings.hours')}</label>
                    <div className="relative">
                      <Clock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                      <input
                        type="text"
                        value={settings.businessHours}
                        onChange={(e) => setSettings({ ...settings, businessHours: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
                        placeholder="Mon - Sat: 08:00 AM - 06:00 PM"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-app-muted font-semibold mb-1.5">{t('settings.address')}</label>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                      <input
                        type="text"
                        value={settings.address}
                        onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
                        placeholder="Phnom Penh, Cambodia"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-xl text-xs transition-colors shadow-subtle"
                >
                  <FloppyDisk size={16} weight="bold" />
                  {t('settings.saveProfile')}
                </button>
              </div>
            </div>

            {/* Live Branding Preview Card */}
            <div className="space-y-4">
              <div className="bg-app-card rounded-2xl border border-app-border p-5 shadow-card space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-app-border">
                  <span className="text-xs font-bold text-app-muted uppercase tracking-wider">{t('settings.liveInvoiceHeader')}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-app-hover text-app-muted font-mono">Realtime</span>
                </div>

                <div className="p-4 bg-app-hover/50 border border-app-border rounded-xl space-y-3 font-sans text-xs">
                  <div className="border-b border-app-border pb-3">
                    <h3 className="font-bold text-sm text-app-text">{settings.shopName || 'Precision Auto Works'}</h3>
                    <p className="text-[11px] text-app-muted">{settings.address || 'Phnom Penh, Cambodia'}</p>
                    <div className="flex flex-wrap gap-x-3 text-[10px] text-app-muted mt-1 font-mono">
                      <span>Tel: {settings.contactPhone || '012 345 678'}</span>
                      <span>Email: {settings.contactEmail || 'info@precisionauto.com'}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-app-muted space-y-1">
                    <div className="flex justify-between">
                      <span>Hours:</span>
                      <span className="text-app-text font-medium">{settings.businessHours || '08:00 - 18:00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax Rate:</span>
                      <span className="text-app-text font-medium">{settings.taxRate}%</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-app-muted leading-relaxed">
                  {t('settings.brandingDesc')}
                </p>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ============================================================ */}
      {/* TAB: LANGUAGE & LOCALIZATION SETTINGS                        */}
      {/* ============================================================ */}
      {activeTab === 'language' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-app-card rounded-2xl border border-app-border p-6 shadow-card space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-app-border">
              <div className="w-10 h-10 rounded-xl bg-app-accent/15 flex items-center justify-center text-app-accent">
                <Translate size={22} weight="bold" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-app-text">{t('settings.language')}</h2>
                <p className="text-xs text-app-muted">{t('settings.languageDesc')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <button
                type="button"
                onClick={() => i18n.changeLanguage('km')}
                className={`p-4 rounded-2xl border flex items-center gap-3.5 transition-all text-left ${
                  i18n.language === 'km'
                    ? 'border-app-accent bg-app-accent/10 ring-2 ring-app-accent/20'
                    : 'border-app-border bg-app-card hover:bg-app-hover'
                }`}
              >
                <span className="text-3xl">🇰🇭</span>
                <div>
                  <p className="font-bold text-sm text-app-text">ភាសាខ្មែរ</p>
                  <p className="text-xs text-app-muted">Khmer (Cambodia)</p>
                </div>
                {i18n.language === 'km' && <Check size={20} className="ml-auto text-app-accent" weight="bold" />}
              </button>

              <button
                type="button"
                onClick={() => i18n.changeLanguage('en')}
                className={`p-4 rounded-2xl border flex items-center gap-3.5 transition-all text-left ${
                  i18n.language === 'en'
                    ? 'border-app-accent bg-app-accent/10 ring-2 ring-app-accent/20'
                    : 'border-app-border bg-app-card hover:bg-app-hover'
                }`}
              >
                <span className="text-3xl">🇬🇧</span>
                <div>
                  <p className="font-bold text-sm text-app-text">English</p>
                  <p className="text-xs text-app-muted">English (US / UK)</p>
                </div>
                {i18n.language === 'en' && <Check size={20} className="ml-auto text-app-accent" weight="bold" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: TAX & INVOICING DEFAULTS                              */}
      {/* ============================================================ */}
      {activeTab === 'billing' && (
        <form onSubmit={handleSettingsSubmit} className="space-y-6 animate-fade-in">
          {saved && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in">
              <ShieldCheck size={18} weight="bold" />
              {t('settings.taxUpdated')}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-app-card rounded-2xl border border-app-border p-6 shadow-card space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-app-border">
                <Receipt size={18} className="text-app-accent" weight="bold" />
                <h2 className="text-sm font-bold text-app-text">{t('settings.financialParams')}</h2>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-app-muted font-semibold mb-1.5">{t('settings.taxRate')} (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.taxRate}
                      onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent tabular-nums font-semibold"
                    />
                  </div>
                  <p className="text-[11px] text-app-muted mt-1">{t('settings.taxDesc')}</p>
                </div>

                <div>
                  <label className="block text-app-muted font-semibold mb-1.5">{t('settings.currencyFormat')}</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full px-3.5 py-2 bg-app-input border border-app-border rounded-xl text-app-text focus:outline-none focus:border-app-accent"
                  >
                    <option value="USD ($)">USD ($) - US Dollar</option>
                    <option value="KHR (៛)">KHR (៛) - Cambodian Riel</option>
                    <option value="EUR (€)">EUR (€) - Euro</option>
                    <option value="GBP (£)">GBP (£) - British Pound</option>
                    <option value="THB (฿)">THB (฿) - Thai Baht</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dynamic Calculation Sample */}
            <div className="bg-app-card rounded-2xl border border-app-border p-6 shadow-card space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-app-border">
                <CurrencyDollar size={18} className="text-emerald-500" weight="bold" />
                <h2 className="text-sm font-bold text-app-text">{t('settings.taxSimulation')}</h2>
              </div>

              <div className="bg-app-hover/50 border border-app-border rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-app-muted">
                  <span>Sample Labor & Diagnostics:</span>
                  <span className="font-mono text-app-text">$120.00</span>
                </div>
                <div className="flex justify-between text-app-muted">
                  <span>Sample Parts (Brake Pads):</span>
                  <span className="font-mono text-app-text">$85.00</span>
                </div>
                <div className="flex justify-between text-app-muted">
                  <span>Subtotal:</span>
                  <span className="font-mono text-app-text font-bold">$205.00</span>
                </div>
                <div className="flex justify-between text-app-muted border-t border-app-border pt-2">
                  <span>Calculated Tax ({settings.taxRate}%):</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    ${((205 * Number(settings.taxRate || 0)) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-app-text font-bold border-t border-app-border pt-2 text-sm">
                  <span>Total Invoice Amount:</span>
                  <span className="font-mono text-app-accent">
                    ${(205 + (205 * Number(settings.taxRate || 0)) / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-xl text-xs transition-colors shadow-subtle"
            >
              <FloppyDisk size={16} weight="bold" />
              {t('settings.saveTax')}
            </button>
          </div>
        </form>
      )}

      {/* ============================================================ */}
      {/* TAB 4: DATA SAFETY & BACKUPS                                 */}
      {/* ============================================================ */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-fade-in">
          {importStatus && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in ${
                importStatus.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-600'
              }`}
            >
              {importStatus.type === 'success' ? <CheckCircle size={18} /> : <WarningCircle size={18} />}
              {importStatus.message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Automatic Backup Card */}
            <div className="bg-app-card rounded-2xl border border-app-border p-6 shadow-card space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-app-border">
                <Database size={18} className="text-app-accent" weight="bold" />
                <h2 className="text-sm font-bold text-app-text">{t('settings.dataSafety')}</h2>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-app-text">Daily Automated Database Backup</p>
                  <p className="text-[11px] text-app-muted mt-0.5">
                    Generate encrypted SQLite and settings snapshot daily at 02:00 AM UTC
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updated = !settings.autoBackupDaily
                    setSettings({ ...settings, autoBackupDaily: updated })
                    settingsService.updateSettings({ ...settings, autoBackupDaily: updated })
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    settings.autoBackupDaily ? 'bg-emerald-500' : 'bg-app-hover border border-app-border'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.autoBackupDaily ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
                  <Check size={12} weight="bold" /> Backup Daemon Active
                </span>
              </div>
            </div>

            {/* Export & Restore Configuration */}
            <div className="bg-app-card rounded-2xl border border-app-border p-6 shadow-card space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-app-border">
                <DownloadSimple size={18} className="text-blue-500" weight="bold" />
                <h2 className="text-sm font-bold text-app-text">{t('settings.exportBackup')}</h2>
              </div>

              <p className="text-xs text-app-muted">
                {t('settings.exportBackupDesc')}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const exportPayload = {
                      version: '2.0',
                      exportedAt: new Date().toISOString(),
                      settings,
                      permissionsMatrix: localMatrix,
                    }
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2))
                    const downloadAnchor = document.createElement('a')
                    downloadAnchor.setAttribute('href', dataStr)
                    downloadAnchor.setAttribute('download', `workshop_full_backup_${new Date().toISOString().split('T')[0]}.json`)
                    document.body.appendChild(downloadAnchor)
                    downloadAnchor.click()
                    downloadAnchor.remove()
                  }}
                  className="px-4 py-2 bg-app-hover hover:bg-app-border rounded-xl text-xs font-semibold text-app-text transition-colors inline-flex items-center gap-2"
                >
                  <DownloadSimple size={15} weight="bold" />
                  {t('settings.exportJson')}
                </button>

                <label className="px-4 py-2 bg-app-card hover:bg-app-hover border border-app-border rounded-xl text-xs font-semibold text-app-text transition-colors inline-flex items-center gap-2 cursor-pointer">
                  <UploadSimple size={15} weight="bold" />
                  {t('settings.importJson')}
                  <input type="file" accept=".json" onChange={handleImportConfig} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
