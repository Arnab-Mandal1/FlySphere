'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useFlightStore } from '@/lib/stores/useFlightStore'
import { useUserStore } from '@/lib/stores/useUserStore'
import { SeatGrid } from './SeatGrid'
import { formatCurrency } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'
import type { Flight, Seat, SeatClass } from '@/types'

interface SeatMapProps {
  readonly flight: Flight
  readonly initialSeats: Seat[]
}

const CLASS_MULTIPLIER: Record<SeatClass, number> = {
  economy: 1,
  business: 1.8,
  first: 3.2,
}

export function SeatMap({ flight, initialSeats }: SeatMapProps) {
  const router = useRouter()
  const { user } = useUserStore()
  const { searchQuery, selectedSeat, setSelectedSeat, setOptimisticSeatId, setCurrentStep } = useFlightStore()
  const [seats, setSeats] = useState<Seat[]>(initialSeats)
  const [realtimeConnected, setRealtimeConnected] = useState(false)

  const seatClass = searchQuery?.class ?? 'economy'
  const basePrice = Math.round(flight.base_price * CLASS_MULTIPLIER[seatClass])

  const updateSeat = (payload: { new: Record<string, unknown> }) => {
    setSeats((prev) =>
      prev.map((s) => s.id === payload.new.id ? { ...s, ...(payload.new as unknown as Seat) } : s)
    )
  }

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`seats:${flight.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'seats', filter: `flight_id=eq.${flight.id}` },
        updateSeat
      )
      .subscribe((status) => {
        setRealtimeConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [flight.id])

  const handleSeatSelect = (seat: Seat) => {
    if (!seat.is_available) return
    if (selectedSeat?.id === seat.id) {
      setSelectedSeat(null)
      setOptimisticSeatId(null)
    } else {
      setSelectedSeat(seat)
      setOptimisticSeatId(seat.id)
    }
  }

  const handleContinue = () => {
    if (!selectedSeat) return
    if (!user) {
      router.push(`/auth/login?redirectTo=/seat-map/${flight.id}`)
      return
    }
    setCurrentStep('passenger')
    router.push(`/booking/${flight.id}`)
  }

  const totalPrice = selectedSeat ? basePrice + selectedSeat.extra_fee : basePrice

  const legendItems = [
    { color: 'bg-sky-500', label: 'Available' },
    { color: 'bg-amber-400', label: 'Business class' },
    { color: 'bg-purple-500', label: 'First class' },
    { color: 'bg-green-500', label: 'Your selection' },
    { color: 'bg-slate-300', label: 'Occupied' },
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        <SeatGrid
          seats={seats}
          selectedSeatId={selectedSeat?.id ?? null}
          onSeatSelect={handleSeatSelect}
          flightClass={seatClass}
        />
      </div>

      <div className="lg:w-72">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sticky top-20">
          <h3 className="font-semibold text-slate-800 mb-3">Legend</h3>
          <div className="space-y-2 mb-5">
            {legendItems.map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-slate-600">
                <div className={`w-4 h-4 rounded ${color}`} />
                {label}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs mb-5">
            <div className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-green-400 animate-pulse' : 'bg-slate-300'}`} />
            <span className="text-slate-400">
              {realtimeConnected ? 'Live availability' : 'Connecting...'}
            </span>
          </div>

          {selectedSeat ? (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-slate-500 mb-1">Selected seat</p>
              <p className="text-2xl font-bold text-slate-900">{selectedSeat.seat_number}</p>
              <p className="text-sm capitalize text-slate-500">{selectedSeat.class} class</p>
              {selectedSeat.extra_fee > 0 && (
                <p className="text-sm text-sky-600 mt-1">+{formatCurrency(selectedSeat.extra_fee)} seat fee</p>
              )}
              <div className="border-t border-sky-200 mt-3 pt-3">
                <p className="text-sm text-slate-500">Total fare</p>
                <p className="text-xl font-bold text-sky-600">{formatCurrency(totalPrice)}</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 text-center">
              <p className="text-sm text-slate-400">No seat selected</p>
              <p className="text-xs text-slate-300 mt-1">Tap a seat on the map</p>
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={!selectedSeat}
            className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
