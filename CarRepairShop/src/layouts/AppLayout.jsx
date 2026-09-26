import { Outlet, Navigate, useLocation } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import TopBar from '../components/layout/TopBar'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from '../components/ui'
import { useAppStore } from '../store/useAppStore'
import { FadeIn } from '../components/animation/AnimeWrapper'

export default function AppLayout() {
  const { user, loading } = useAuth()
  const location = useLocation()
  
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useAppStore((state) => state.toggleSidebar)
  const mobileSidebarOpen = useAppStore((state) => state.mobileSidebarOpen)
  const setMobileSidebarOpen = useAppStore((state) => state.setMobileSidebarOpen)

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-250 font-sans">
      {/* Sidebar (Desktop Collapsible & Mobile Slide-over Drawer) */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
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
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-250">
          <FadeIn key={location.pathname} duration={300} delay={0} className="w-full mx-auto pb-12">
            <Outlet />
          </FadeIn>
        </main>
      </div>
    </div>
  )
}
