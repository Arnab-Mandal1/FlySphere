'use client'
import type React from 'react'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFlightStore } from '@/lib/stores/useFlightStore'
import { useUserStore } from '@/lib/stores/useUserStore'
import { createClient } from '@/lib/supabase/client'
import { generatePNR, formatCurrency, formatTime } from '@/lib/utils'
import { Plane, User, Loader2, ArrowLeft } from 'lucide-react'
import type { SeatClass } from '@/types'
import Link from 'next/link'

const CLASS_MULTIPLIER: Record<SeatClass, number> = {
  economy: 1,
  business: 1.8,
  first: 3.2,
}

function getBookingError(message: string): string {
  if (message.includes('BOOKING_CUTOFF')) {
    return 'Bookings close 1 hour before departure. This flight is no longer available for booking.'
  }
  if (message.includes('SEAT_UNAVAILABLE')) {
    return 'Sorry, this seat was just taken. Please go back and select another seat.'
  }
  return 'Something went wrong. Please try again.'
}

export default function BookingPage() {
  const router = useRouter()
  const { selectedFlight, selectedSeat, searchQuery, setPassengerForm, setCurrentStep } = useFlightStore()
  const { user } = useUserStore()

  const [fullName, setFullName] = useState('')
  const [passportNo, setPassportNo] = useState('')
  const [nationality, setNationality] = useState('')
  const [dob, setDob] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!selectedFlight || !selectedSeat) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">No flight or seat selected.</p>
          <Link href="/search" className="text-sky-600 hover:underline">Back to search</Link>
        </div>
      </div>
    )
  }

  const seatClass = searchQuery?.class ?? 'economy'
  const basePrice = Math.round(selectedFlight.base_price * CLASS_MULTIPLIER[seatClass])
  const totalPrice = basePrice + selectedSeat.extra_fee

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) {
      router.push('/auth/login')
      return
    }

    setError('')
    setLoading(true)
    setPassengerForm({ full_name: fullName, passport_no: passportNo, nationality, dob })

    const supabase = createClient()
    const pnrCode = generatePNR()

    try {
      const { data: booking, error: bookingError } = await (supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: { id: string }; error: { message: string } | null }> }).rpc('reserve_seat', {
        p_user_id: user.id,
        p_flight_id: selectedFlight.id,
        p_seat_id: selectedSeat.id,
        p_total_price: totalPrice,
        p_pnr_code: pnrCode,
      })

      if (bookingError) {
        setError(getBookingError(bookingError.message))
        setLoading(false)
        return
      }

      const { error: passengerError } = await (supabase as unknown as { from: (t: string) => { insert: (d: Record<string, unknown>) => Promise<{ error: { message: string } | null }> } }).from('passengers').insert({
        booking_id: booking.id,
        full_name: fullName,
        passport_no: passportNo,
        nationality,
        dob,
      })

      if (passengerError) {
        setError('Booking created but failed to save passenger details.')
        setLoading(false)
        return
      }

      setCurrentStep('confirm')
      router.push(`/booking/confirmation?pnr=${pnrCode}&bookingId=${booking.id}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/seat-map/${selectedFlight.id}`}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to seat map
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">Passenger details</h1>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-sky-100 p-2 rounded-lg">
                <Plane className="w-5 h-5 text-sky-600 rotate-90" />
              </div>
              <div>
                <p className="font-bold text-slate-900">
                  {selectedFlight.origin} → {selectedFlight.destination}
                </p>
                <p className="text-sm text-slate-500">
                  {selectedFlight.flight_no} · {formatTime(selectedFlight.departs_at)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Seat {selectedSeat.seat_number}</p>
              <p className="font-bold text-sky-600 text-lg">{formatCurrency(totalPrice)}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-sky-500" />
            <h2 className="font-semibold text-slate-800">Passenger 1</h2>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="As on passport"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="passportNo" className="block text-sm font-medium text-slate-700 mb-1.5">
                Passport number
              </label>
              <input
                id="passportNo"
                type="text"
                required
                value={passportNo}
                onChange={(e) => setPassportNo(e.target.value.toUpperCase())}
                placeholder="A1234567"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label htmlFor="nationality" className="block text-sm font-medium text-slate-700 mb-1.5">
                Nationality
              </label>
              <input
                id="nationality"
                type="text"
                required
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="Indian"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-slate-700 mb-1.5">
                Date of birth
              </label>
              <input
                id="dob"
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-70 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Confirming booking…' : `Confirm booking · ${formatCurrency(totalPrice)}`}
          </button>
        </form>
      </div>
    </div>
  )
}
