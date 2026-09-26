import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useWorkspaceStore = create(
  persist(
    (set) => ({
      // Drafts for active documents (so they aren't lost if the user navigates away)
      activeDrafts: {},
      setDraft: (key, data) => set((state) => ({
        activeDrafts: {
          ...state.activeDrafts,
          [key]: { ...state.activeDrafts[key], ...data }
        }
      })),
      clearDraft: (key) => set((state) => {
        const drafts = { ...state.activeDrafts }
        delete drafts[key]
        return { activeDrafts: drafts }
      }),
      clearAllDrafts: () => set({ activeDrafts: {} })
    }),
    {
      name: 'workspace-draft-storage',
    }
  )
)
