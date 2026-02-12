import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getMandalart, saveMandalart } from '../server/mandalart'

export interface MandalartCell {
  id: string
  value: string
  sectionIndex: number
  cellIndex: number
}

export interface MandalartData {
  year: string
  title: string
  keyword: string
  commitment: string
  cells: MandalartCell[]
}

interface MandalartStore {
  data: MandalartData
  serverId: string | null
  isSyncing: boolean
  updateMetadata: (field: keyof Pick<MandalartData, 'year' | 'title' | 'keyword' | 'commitment'>, value: string) => void
  updateCell: (id: string, value: string) => void
  initializeCells: () => void
  resetSection: (sectionIndex: number) => void
  resetAll: () => void
  loadFromServer: () => Promise<void>
  syncToServer: () => Promise<void>
  setData: (data: MandalartData, serverId?: string) => void
}

let syncTimeout: NodeJS.Timeout | null = null

const createEmptyCells = (): MandalartCell[] => {
  const cells: MandalartCell[] = []
  for (let sectionIndex = 0; sectionIndex < 9; sectionIndex++) {
    for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
      cells.push({
        id: `${sectionIndex}-${cellIndex}`,
        value: '',
        sectionIndex,
        cellIndex,
      })
    }
  }
  return cells
}

export const useMandalartStore = create<MandalartStore>()(
  persist(
    (set, get) => ({
      data: {
        year: new Date().getFullYear().toString(),
        title: '',
        keyword: '',
        commitment: '',
        cells: createEmptyCells(),
      },
      serverId: null,
      isSyncing: false,

      updateMetadata: (field, value) => {
        set((state) => ({
          data: {
            ...state.data,
            [field]: value,
          },
        }))

        if (syncTimeout) clearTimeout(syncTimeout)
        syncTimeout = setTimeout(() => {
          get().syncToServer()
        }, 1000)
      },

      updateCell: (id, value) => {
        set((state) => ({
          data: {
            ...state.data,
            cells: state.data.cells.map((cell) =>
              cell.id === id ? { ...cell, value } : cell
            ),
          },
        }))

        if (syncTimeout) clearTimeout(syncTimeout)
        syncTimeout = setTimeout(() => {
          get().syncToServer()
        }, 1000)
      },

      initializeCells: () =>
        set((state) => ({
          data: {
            ...state.data,
            cells: createEmptyCells(),
          },
        })),

      resetSection: (sectionIndex: number) => {
        set((state) => ({
          data: {
            ...state.data,
            cells: state.data.cells.map((cell) =>
              cell.sectionIndex === sectionIndex ? { ...cell, value: '' } : cell
            ),
          },
        }))

        if (syncTimeout) clearTimeout(syncTimeout)
        syncTimeout = setTimeout(() => {
          get().syncToServer()
        }, 1000)
      },

      resetAll: () => {
        set(() => ({
          data: {
            year: new Date().getFullYear().toString(),
            title: '',
            keyword: '',
            commitment: '',
            cells: createEmptyCells(),
          },
          serverId: null,
        }))

        if (syncTimeout) clearTimeout(syncTimeout)
        syncTimeout = setTimeout(() => {
          get().syncToServer()
        }, 1000)
      },

      loadFromServer: async () => {
        try {
          const state = get()
          const results = await getMandalart({ data: { year: state.data.year } })

          if (results.length > 0) {
            const serverData = results[0]
            set({
              data: {
                year: serverData.year,
                title: serverData.title,
                keyword: serverData.keyword,
                commitment: serverData.commitment,
                cells: serverData.cells,
              },
              serverId: serverData.id,
            })
          }
        } catch (error) {
          console.error('Failed to load from server:', error)
        }
      },

      syncToServer: async () => {
        const state = get()
        if (state.isSyncing) return

        set({ isSyncing: true })

        try {
          const result = await saveMandalart({
            data: {
              ...state.data,
              id: state.serverId || undefined,
            },
          })

          set({ serverId: result.id, isSyncing: false })
        } catch (error) {
          console.error('Failed to sync to server:', error)
          set({ isSyncing: false })
        }
      },

      setData: (data: MandalartData, serverId?: string) => {
        set({ data, serverId: serverId || null })
      },
    }),
    {
      name: 'mandalart-storage',
    }
  )
)
