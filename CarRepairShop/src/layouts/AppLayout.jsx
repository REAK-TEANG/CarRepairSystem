import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import TopBar from '../components/layout/TopBar'

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-250 font-sans">
      {/* Sidebar (Desktop Collapsible & Mobile Slide-over Drawer) */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Bar */}
        <TopBar
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-250">
          <div className="max-w-7xl mx-auto animate-fade-in pb-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
