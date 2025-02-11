import { randUuid } from '@ngneat/falso'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'
import { Ticket } from '../features/tickets/types'

interface MockStoreRecord {
  id: string | number
  [key: string]: any
}

export interface MockStore<Type extends MockStoreRecord = MockStoreRecord> {
  data: Record<string, Type>
  setData(data: Record<string, Type>): void
  add(value: Type): void
  update(id: string | number, value: Type): void
  get(id?: string): Type | Record<string, Type>
  all(): Type[]
  remove(id: string | number): void
  filter(fn: (value: Type, i: number, arr: Type[]) => value is Type): Type[]
}

export const createMockStore = <Type extends MockStoreRecord = MockStoreRecord>(
  key: string,
  initialData: Record<string, Type> = {},
) => {
  const store = createStore<
    MockStore<Type>,
    [['zustand/persist', MockStore<Type>]]
  >(
    persist(
      (set, get) => ({
        data: initialData,
        setData: (data) => {
          set({ data })
        },
        add: (value) => {
          const data = get().data

          data[value.id || randUuid()] = value

          set({ data })
        },
        update: (id, value) => {
          const data = get().data

          data[id] = value

          set({ data })
        },
        remove: (id) => {
          const data = get().data

          delete data[id]

          set({ data })
        },
        get: (id?: string) => {
          const data = get().data

          if (id) {
            return data[id]
          }

          return data
        },
        all: () => {
          return Object.values(get().data)
        },
        filter: (fn) => {
          return Object.values(get().data).filter<Type>(fn)
        },
      }),
      {
        name: `app.mock-data.${key}`,
        storage: createJSONStorage(() => {
          const isServer = typeof window === 'undefined'

          return {
            getItem: async (name: string) =>
              isServer ? null : localStorage.getItem(name),
            setItem: (name: string, value: string) =>
              isServer ? null : localStorage.setItem(name, value),
            removeItem: (name: string) =>
              isServer ? null : localStorage.removeItem(name),
          }
        }),
      },
    ),
  )

  return store
}

interface TicketsState {
  data: Record<string, Ticket>
  add: (ticket: Ticket) => void
  remove: (id: string) => void
  update: (ticket: Ticket) => void
}

export const ticketsStore = createStore<TicketsState>((set) => ({
  data: {},
  add: (ticket) =>
    set((state) => ({
      data: { ...state.data, [ticket.id]: ticket },
    })),
  remove: (id) =>
    set((state) => {
      const { [id]: removed, ...rest } = state.data
      return { data: rest }
    }),
  update: (ticket) =>
    set((state) => ({
      data: { ...state.data, [ticket.id]: ticket },
    })),
}))
