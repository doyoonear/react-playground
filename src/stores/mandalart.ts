import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  updateMetadata: (field: keyof Pick<MandalartData, 'year' | 'title' | 'keyword' | 'commitment'>, value: string) => void
  updateCell: (id: string, value: string) => void
  initializeCells: () => void
  resetSection: (sectionIndex: number) => void
  resetAll: () => void
}

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
    (set) => ({
      data: {
        year: new Date().getFullYear().toString(),
        title: '',
        keyword: '',
        commitment: '',
        cells: createEmptyCells(),
      },
      updateMetadata: (field, value) =>
        set((state) => ({
          data: {
            ...state.data,
            [field]: value,
          },
        })),
      updateCell: (id, value) =>
        set((state) => ({
          data: {
            ...state.data,
            cells: state.data.cells.map((cell) =>
              cell.id === id ? { ...cell, value } : cell
            ),
          },
        })),
      initializeCells: () =>
        set((state) => ({
          data: {
            ...state.data,
            cells: createEmptyCells(),
          },
        })),
      resetSection: (sectionIndex: number) =>
        set((state) => ({
          data: {
            ...state.data,
            cells: state.data.cells.map((cell) =>
              cell.sectionIndex === sectionIndex ? { ...cell, value: '' } : cell
            ),
          },
        })),
      resetAll: () =>
        set(() => ({
          data: {
            year: new Date().getFullYear().toString(),
            title: '',
            keyword: '',
            commitment: '',
            cells: createEmptyCells(),
          },
        })),
    }),
    {
      name: 'mandalart-storage',
    }
  )
)
