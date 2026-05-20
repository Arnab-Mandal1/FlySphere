import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import type { Booking } from '@/types'

interface UserState {
  user: User | null

  sessionToken: string | null
  cachedBookings: Booking[]
  isLoadingBookings: boolean
}

interface UserActions {
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setCachedBookings: (bookings: Booking[]) => void
  setLoadingBookings: (loading: boolean) => void
  updateBookingInCache: (bookingId: string, updates: Partial<Booking>) => void
  resetUser: () => void
}

type UserStore = UserState & UserActions

const initialState: UserState = {
  user: null,
  sessionToken: null,
  cachedBookings: [],
  isLoadingBookings: false,
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ user }),

      setSession: (session) =>
        set({
          user: session?.user ?? null,
          sessionToken: session?.access_token ?? null,
        }),

      setCachedBookings: (bookings) =>
        set({ cachedBookings: bookings }),

      setLoadingBookings: (loading) =>
        set({ isLoadingBookings: loading }),

      updateBookingInCache: (bookingId, updates) =>
        set({
          cachedBookings: get().cachedBookings.map((b) =>
            b.id === bookingId ? { ...b, ...updates } : b
          ),
        }),

      resetUser: () => set(initialState),
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        sessionToken: state.sessionToken,
        cachedBookings: state.cachedBookings,

        user: null,
        isLoadingBookings: false,
      }),
    }
  )
)
