'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Plane, Copy, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useFlightStore } from '@/lib/stores/useFlightStore'
import { useUserStore } from '@/lib/stores/useUserStore'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import type { Booking } from '@/types'

export default function ConfirmationPage() {
  const searchParams = useSearchParams()
  const pnr = searchParams.get('pnr')
  const bookingId = searchParams.get('bookingId')

  const [booking, setBooking] = useState<Booking | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(!!bookingId)

  useEffect(() => {
    useFlightStore.getState().resetBookingFlow()
  }, [])

  useEffect(() => {
    if (!bookingId) return

    const supabase = createClient()

    const load = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*, flight:flights(*), seat:seats(*), passengers(*)')
        .eq('id', bookingId)
        .single()

      if (data) {
        const typed = data as unknown as Booking
        setBooking(typed)
        const cached = useUserStore.getState().cachedBookings
        useUserStore.getState().setCachedBookings([typed, ...cached])
      }
      setLoading(false)
    }

    void load()
  }, [bookingId])

  const handleCopyPNR = () => {
    if (!pnr) return
    void navigator.clipboard.writeText(pnr).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading your booking...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Booking confirmed!</h1>
          <p className="text-slate-500">Your booking has been successfully created.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 text-center">
          <p className="text-sm text-slate-500 mb-2">Your PNR code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-bold font-mono tracking-widest text-slate-900">{pnr}</span>
            <button
              onClick={handleCopyPNR}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600"
              title="Copy PNR"
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Save this code to manage your booking</p>
        </div>

        {booking && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 space-y-4">
            <h2 className="font-semibold text-slate-800">Booking details</h2>

            {booking.flight && (
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="bg-sky-50 p-2.5 rounded-xl">
                  <Plane className="w-5 h-5 text-sky-600 rotate-90" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">
                    {booking.flight.origin} → {booking.flight.destination}
                  </p>
                  <p className="text-sm text-slate-500">
                    {booking.flight.flight_no} · {formatDateTime(booking.flight.departs_at)}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {booking.seat && (
                <div>
                  <p className="text-slate-400">Seat</p>
                  <p className="font-semibold text-slate-800 capitalize">
                    {booking.seat.seat_number} ({booking.seat.class})
                  </p>
                </div>
              )}
              <div>
                <p className="text-slate-400">Total paid</p>
                <p className="font-semibold text-sky-600">{formatCurrency(booking.total_price)}</p>
              </div>
              {booking.passengers?.[0] && (
                <div>
                  <p className="text-slate-400">Passenger</p>
                  <p className="font-semibold text-slate-800">{booking.passengers[0].full_name}</p>
                </div>
              )}
              <div>
                <p className="text-slate-400">Status</p>
                <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full capitalize">
                  {booking.status}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/bookings"
            className="flex-1 text-center bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-xl transition-colors">
            View my bookings
          </Link>
          <Link href="/search"
            className="flex-1 text-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition-colors">
            Book another
          </Link>
        </div>
      </div>
    </div>
  )
}
