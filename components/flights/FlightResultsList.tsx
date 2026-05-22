'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plane, Clock, ArrowRight } from 'lucide-react'
import { useFlightStore } from '@/lib/stores/useFlightStore'
import { formatTime, formatDuration, formatCurrency, cn } from '@/lib/utils'
import type { Flight, SeatClass } from '@/types'

interface FlightResultsListProps {
  readonly flights: Flight[]
  readonly seatClass: SeatClass
  readonly passengers: number
}

const CLASS_MULTIPLIER: Record<SeatClass, number> = {
  economy: 1,
  business: 1.8,
  first: 3.2,
}

const CLASS_BADGE: Record<SeatClass, string> = {
  economy:  'bg-slate-100 text-slate-600',
  business: 'bg-blue-100 text-blue-700',
  first:    'bg-amber-100 text-amber-700',
}

export function FlightResultsList({ flights, seatClass, passengers }: FlightResultsListProps) {
  const router = useRouter()
  const { setSelectedFlight, setCurrentStep } = useFlightStore()
  const [cutoffError, setCutoffError] = useState<string | null>(null)

  if (flights.length === 0) {
    return (
      <div className="text-center py-20">
        <Plane className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-600 mb-2">No flights found</h2>
        <p className="text-slate-400">Try a different date or route.</p>
      </div>
    )
  }

  const handleSelect = (flight: Flight) => {
    const timeUntilDeparture = new Date(flight.departs_at).getTime() - Date.now()
    const oneHourMs = 60 * 60 * 1000

    if (timeUntilDeparture <= oneHourMs) {
      setCutoffError(`Bookings for flight ${flight.flight_no} are closed. Booking closes 1 hour before departure.`)
      return
    }

    setSelectedFlight(flight)
    setCurrentStep('seat')
    router.push(`/seat-map/${flight.id}`)
  }

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">
        {flights.length} flight{flights.length > 1 ? 's' : ''} found
      </p>

      {/* Booking cutoff popup */}
      {cutoffError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Booking closed</h3>
            <p className="text-slate-500 text-sm mb-5">{cutoffError}</p>
            <button
              onClick={() => setCutoffError(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {flights.map((flight) => {
          const price = Math.round(flight.base_price * CLASS_MULTIPLIER[seatClass])
          const totalPrice = price * passengers
          const duration = formatDuration(flight.departs_at, flight.arrives_at)

          return (
            <div
              key={flight.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all p-5 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-800 text-lg">{flight.flight_no}</span>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', CLASS_BADGE[seatClass])}>
                      {seatClass}
                    </span>
                    <span className="text-xs text-slate-400">{flight.aircraft_type}</span>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">{formatTime(flight.departs_at)}</p>
                      <p className="text-sm font-semibold text-slate-600">{flight.origin}</p>
                    </div>

                    <div className="flex-1 flex flex-col items-center">
                      <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                        <Clock className="w-3 h-3" />
                        {duration}
                      </div>
                      <div className="w-full flex items-center gap-1">
                        <div className="flex-1 h-px bg-slate-200" />
                        <Plane className="w-4 h-4 text-sky-500 rotate-90" />
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>
                      <p className="text-xs text-green-600 mt-1 font-medium">Direct</p>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">{formatTime(flight.arrives_at)}</p>
                      <p className="text-sm font-semibold text-slate-600">{flight.destination}</p>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right flex sm:flex-col items-center sm:items-end gap-4 sm:gap-2 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6">
                  <div>
                    <p className="text-2xl font-bold text-sky-600">{formatCurrency(price)}</p>
                    <p className="text-xs text-slate-400">per person</p>
                    {passengers > 1 && (
                      <p className="text-sm text-slate-500 font-medium">{formatCurrency(totalPrice)} total</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleSelect(flight)}
                    className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
                  >
                    Select <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
