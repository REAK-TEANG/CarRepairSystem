import { useState, useEffect } from 'react'
import { FloppyDisk, Database, Gear, ShieldCheck } from '@phosphor-icons/react'
import { settingsService } from '../../services/settingsService'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    shopName: '',
    taxRate: 0,
    currency: '',
    businessHours: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    autoBackupDaily: true,
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    settingsService.getSettings().then(setSettings)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    settingsService.updateSettings(settings).then(() => {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <div className="space-y-6 text-app-text font-sans max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">System & Workshop Settings</h1>
        <p className="text-xs text-app-muted mt-1">Configure workshop parameters, taxation, currency, and database backups</p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-medium flex items-center gap-2 animate-fade-in">
          <ShieldCheck size={16} weight="bold" />
          Settings have been successfully updated.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Workshop Info */}
        <div className="bg-app-card rounded-xl border border-app-border p-5 shadow-card space-y-4">
          <h2 className="text-sm font-semibold text-app-text flex items-center gap-2">
            <Gear size={16} className="text-app-accent" />
            Workshop Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-app-muted font-medium mb-1.5">Workshop Name</label>
              <input
                type="text"
                value={settings.shopName}
                onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                className="w-full px-3.5 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1.5">Contact Phone</label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-3.5 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1.5">Contact Email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3.5 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1.5">Business Hours</label>
              <input
                type="text"
                value={settings.businessHours}
                onChange={(e) => setSettings({ ...settings, businessHours: e.target.value })}
                className="w-full px-3.5 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-app-muted font-medium mb-1.5">Workshop Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3.5 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
        </div>

        {/* Financial & Tax Config */}
        <div className="bg-app-card rounded-xl border border-app-border p-5 shadow-card space-y-4">
          <h2 className="text-sm font-semibold text-app-text">Financial & Tax Configuration</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-app-muted font-medium mb-1.5">Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="block text-app-muted font-medium mb-1.5">Currency Format</label>
              <input
                type="text"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3.5 py-2 bg-app-input border border-app-border rounded-lg text-app-text focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
        </div>

        {/* Database & Security */}
        <div className="bg-app-card rounded-xl border border-app-border p-5 shadow-card space-y-4">
          <h2 className="text-sm font-semibold text-app-text flex items-center gap-2">
            <Database size={16} className="text-app-accent" />
            Database & Backups
          </h2>

          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="font-medium text-app-text">Automated Daily Database Backup</p>
              <p className="text-[11px] text-app-muted">Create automated encrypted snapshot backups daily at 02:00 AM</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoBackupDaily}
              onChange={(e) => setSettings({ ...settings, autoBackupDaily: e.target.checked })}
              className="w-4 h-4 rounded text-app-accent focus:ring-app-accent"
            />
          </div>

          <div className="pt-3 border-t border-app-border flex gap-3">
            <button
              type="button"
              className="px-3.5 py-2 bg-app-hover hover:bg-app-border rounded-lg text-xs font-medium text-app-text transition-colors"
            >
              Export SQL Backup
            </button>
            <button
              type="button"
              className="px-3.5 py-2 bg-app-hover hover:bg-app-border rounded-lg text-xs font-medium text-app-text transition-colors"
            >
              Restore Database
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-app-accent hover:bg-app-accentHover text-app-accentText font-semibold rounded-lg text-xs transition-colors shadow-subtle"
        >
          <FloppyDisk size={16} weight="bold" />
          Save Settings
        </button>
      </form>
    </div>
  )
}
