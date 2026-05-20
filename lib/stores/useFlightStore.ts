import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Flight, Seat, BookingStep, FlightSearchQuery, PassengerFormData } from '@/types'

interface FlightState {
  // Search
  searchQuery: FlightSearchQuery | null

  // Booking flow
  selectedFlight: Flight | null
  selectedSeat: Seat | null
  currentStep: BookingStep


  passengerForm: PassengerFormData | null

  // Optimistic seat state (seat id → selected before server confirms)
  optimisticSeatId: string | null
}

interface FlightActions {
  setSearchQuery: (query: FlightSearchQuery) => void
  setSelectedFlight: (flight: Flight | null) => void
  setSelectedSeat: (seat: Seat | null) => void
  setOptimisticSeatId: (id: string | null) => void
  setCurrentStep: (step: BookingStep) => void
  setPassengerForm: (data: PassengerFormData | null) => void
  resetBookingFlow: () => void
  resetAll: () => void
}

type FlightStore = FlightState & FlightActions

const initialState: FlightState = {
  searchQuery: null,
  selectedFlight: null,
  selectedSeat: null,
  currentStep: 'search',
  passengerForm: null,
  optimisticSeatId: null,
}

export const useFlightStore = create<FlightStore>()(
  persist(
    (set) => ({
      ...initialState,

      setSearchQuery: (query) => set({ searchQuery: query }),

      setSelectedFlight: (flight) =>
        set({ selectedFlight: flight, selectedSeat: null, optimisticSeatId: null }),

      setSelectedSeat: (seat) =>
        set({ selectedSeat: seat }),

      setOptimisticSeatId: (id) =>
        set({ optimisticSeatId: id }),

      setCurrentStep: (step) =>
        set({ currentStep: step }),

      setPassengerForm: (data) =>
        set({ passengerForm: data }),

      resetBookingFlow: () =>
        set({
          selectedFlight: null,
          selectedSeat: null,
          optimisticSeatId: null,
          currentStep: 'search',
          passengerForm: null,
        }),

      resetAll: () => set(initialState),
    }),
    {
      name: 'flight-store',
      storage: createJSONStorage(() => localStorage),

      partialize: (state): Omit<FlightState, 'passengerForm'> & { passengerForm: Omit<PassengerFormData, 'passport_no'> | null } => ({
        searchQuery: state.searchQuery,
        selectedFlight: state.selectedFlight,
        selectedSeat: state.selectedSeat,
        currentStep: state.currentStep,
        optimisticSeatId: state.optimisticSeatId,
        // Strip passport_no before persisting
        passengerForm: state.passengerForm
          ? {
              full_name: state.passengerForm.full_name,
              nationality: state.passengerForm.nationality,
              dob: state.passengerForm.dob,
            }
          : null,
      }),
    }
  )
)
