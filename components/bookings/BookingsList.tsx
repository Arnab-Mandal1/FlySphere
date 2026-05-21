'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plane, Calendar, MapPin, Tag, AlertTriangle, X, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'
import { formatDateTime, formatCurrency, cn } from '@/lib/utils'
import type { Booking, Flight } from '@/types'

interface BookingsListProps {
  readonly initialBookings: Booking[]
}

const STATUS_BADGE: Record<string, string> = {
  confirmed:   'bg-green-100 text-green-700',
  rescheduled: 'bg-blue-100 text-blue-700',
  cancelled:   'bg-slate-100 text-slate-500',
}

function getStatusBadge(status: string): string {
  return STATUS_BADGE[status] ?? 'bg-slate-100 text-slate-500'
}

export function BookingsList({ initialBookings }: BookingsListProps) {
  const router = useRouter()
  const { user, updateBookingInCache } = useUserStore()
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)
  const [reschedulingId, setReschedulingId] = useState<string | null>(null)
  const [altFlights, setAltFlights] = useState<Flight[]>([])
  const [error, setError] = useState('')
  const [pendingReschedule, setPendingReschedule] = useState<{
    booking: Booking
    flight: Flight
    fee: number
  } | null>(null)

  const handleCancelClick = (bookingId: string) => {
    setConfirmCancel(bookingId)
    setError('')
  }

  const handleCancelConfirm = async (bookingId: string) => {
    if (!user) return
    setCancellingId(bookingId)
    setError('')

    const supabase = createClient()
    const { error: cancelError } = await (
        supabase as unknown as {
          rpc: (
              fn: string,
              params?: Record<string, unknown>
          ) => Promise<{ error: { message: string } | null }>
        }
    ).rpc('cancel_booking', {
      p_booking_id: bookingId,
      p_user_id: user.id,
    })

    if (cancelError) {
      const msg = cancelError.message.includes('CANCELLATION_WINDOW')
        ? 'Cannot cancel within 2 hours of departure.'
        : cancelError.message
      setError(msg)
      setCancellingId(null)
      setConfirmCancel(null)
      return
    }

    setBookings((prev) =>
      prev.map((b) => b.id === bookingId ? { ...b, status: 'cancelled' as const } : b)
    )
    updateBookingInCache(bookingId, { status: 'cancelled' })
    setCancellingId(null)
    setConfirmCancel(null)
  }

  const handleRescheduleClick = async (booking: Booking) => {
    if (!booking.flight) return
    setReschedulingId(booking.id)
    setError('')

    const supabase = createClient()
    const { data: flights } = await supabase
      .from('flights')
      .select('*')
      .eq('origin', booking.flight.origin)
      .eq('destination', booking.flight.destination)
      .neq('id', booking.flight_id)
      .neq('status', 'cancelled')
      .gt('departs_at', new Date().toISOString())
      .order('departs_at', { ascending: true })

    setAltFlights((flights || []) as unknown as Flight[])
  }

  const executeReschedule = async (booking: Booking, newFlight: Flight, feeCharged: number) => {
    setError('')
    const supabase = createClient()
    const newTotalPrice = booking.total_price + feeCharged

    const { error: rescheduleError } = await (
        supabase as unknown as {
          from: (table: string) => {
            insert: (
                values: Record<string, unknown>
            ) => Promise<{ error: unknown }>
          }
        }
    )
        .from('reschedules')
        .insert({
        booking_id: booking.id,
        old_flight_id: booking.flight_id,
        new_flight_id: newFlight.id,
        fee_charged: feeCharged,
      })

    if (rescheduleError) {
      setError('Failed to reschedule. Please try again.')
      return
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ flight_id: newFlight.id, status: 'rescheduled', total_price: newTotalPrice } as never)
      .eq('id', booking.id)

    if (updateError) {
      setError('Failed to update booking.')
      return
    }

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== booking.id) return b
        return { ...b, flight_id: newFlight.id, flight: newFlight, status: 'rescheduled' as const, total_price: newTotalPrice }
      })
    )
    updateBookingInCache(booking.id, { flight_id: newFlight.id, status: 'rescheduled' })
    setReschedulingId(null)
    setAltFlights([])
    setPendingReschedule(null)
    router.refresh()
  }

  const handleRescheduleConfirm = (booking: Booking, newFlight: Flight) => {
    const feeCharged = Math.max(0, newFlight.base_price - (booking.flight?.base_price ?? 0))
    if (feeCharged > 0) {
      setPendingReschedule({ booking, flight: newFlight, fee: feeCharged })
      return
    }
    executeReschedule(booking, newFlight, 0)
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-20">
        <Plane className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-600 mb-2">No bookings yet</h2>
        <p className="text-slate-400 mb-6">Your booked flights will appear here.</p>
        <a href="/search" className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
          Search flights
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Error popup */}
      {error && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-100 p-2.5 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-bold text-slate-900">Action failed</h3>
            </div>
            <p className="text-slate-600 text-sm mb-5">{error}</p>
            <button
              onClick={() => setError('')}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Reschedule fee dialog */}
      {pendingReschedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-slate-900 text-lg mb-2">Additional charge required</h3>
            <p className="text-slate-500 text-sm mb-4">
              The new flight is more expensive. You will be charged an additional fee.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center mb-5">
              <p className="text-3xl font-bold text-amber-600">{formatCurrency(pendingReschedule.fee)}</p>
              <p className="text-xs text-amber-500 mt-1">extra charge</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => executeReschedule(pendingReschedule.booking, pendingReschedule.flight, pendingReschedule.fee)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                Pay & Reschedule
              </button>
              <button
                onClick={() => setPendingReschedule(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {bookings.map((booking) => (
        <div
          key={booking.id}
          className={cn(
            'bg-white rounded-2xl border p-5 transition-all',
            booking.status === 'cancelled' ? 'border-slate-200 opacity-60' : 'border-slate-200 hover:shadow-md'
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-sky-50 p-2.5 rounded-xl">
                <Plane className="w-5 h-5 text-sky-600 rotate-90" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-lg">
                  {booking.flight?.origin} → {booking.flight?.destination}
                </p>
                <p className="text-sm text-slate-500">{booking.flight?.flight_no}</p>
              </div>
            </div>
            <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full capitalize', getStatusBadge(booking.status))}>
              {booking.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              {booking.flight ? formatDateTime(booking.flight.departs_at) : '—'}
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400" />
              Seat {booking.seat?.seat_number} ({booking.seat?.class})
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Tag className="w-4 h-4 text-slate-400" />
              <span className="font-mono font-semibold">{booking.pnr_code}</span>
            </div>
            <div className="font-semibold text-sky-600">
              {formatCurrency(booking.total_price)}
            </div>
          </div>

          {booking.status !== 'cancelled' && (
            <div className="flex gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => reschedulingId === booking.id ? setReschedulingId(null) : handleRescheduleClick(booking)}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reschedule
              </button>

              {confirmCancel === booking.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Are you sure?</span>
                  <button
                    onClick={() => handleCancelConfirm(booking.id)}
                    disabled={cancellingId === booking.id}
                    className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-70"
                  >
                    {cancellingId === booking.id ? 'Cancelling...' : 'Yes, cancel'}
                  </button>
                  <button
                    onClick={() => setConfirmCancel(null)}
                    className="text-sm text-slate-500 hover:text-slate-700 px-2 py-1.5"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleCancelClick(booking.id)}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              )}
            </div>
          )}

          {reschedulingId === booking.id && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">Select a new flight:</p>
              {altFlights.length === 0 ? (
                <p className="text-sm text-slate-400">No alternative flights available on this route.</p>
              ) : (
                <div className="space-y-2">
                  {altFlights.map((flight) => (
                    <div key={flight.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{flight.flight_no}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(flight.departs_at)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-sky-600">{formatCurrency(flight.base_price)}</span>
                        <button
                          onClick={() => handleRescheduleConfirm(booking, flight)}
                          className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
