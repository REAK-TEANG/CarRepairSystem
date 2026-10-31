import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
      
      mobileSidebarOpen: false,
      setMobileSidebarOpen: (value) => set({ mobileSidebarOpen: value }),
      toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),

      commandPaletteOpen: false,
      setCommandPaletteOpen: (value) => set({ commandPaletteOpen: value }),
      toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

      fastIntakeModalOpen: false,
      setFastIntakeModalOpen: (value) => set({ fastIntakeModalOpen: value }),
      toggleFastIntakeModal: () => set((state) => ({ fastIntakeModalOpen: !state.fastIntakeModalOpen })),
    }),
    {
      name: 'app-ui-storage',
    }
  )
)
