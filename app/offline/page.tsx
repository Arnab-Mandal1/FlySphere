'use client'

import { WifiOff, Plane } from 'lucide-react'
import Link from 'next/link'
import { useUserStore } from '@/lib/stores/useUserStore'
import { formatDateTime, formatCurrency } from '@/lib/utils'

export default function OfflinePage() {
  const cachedBookings = useUserStore((s) => s.cachedBookings)

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-10 h-10 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">You are offline</h1>
          <p className="text-slate-500">
            No internet connection. Your cached bookings are shown below.
          </p>
        </div>

        {cachedBookings.length > 0 ? (
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
              Cached bookings
            </h2>
            {cachedBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-sky-50 p-2 rounded-xl">
                      <Plane className="w-4 h-4 text-sky-600 rotate-90" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        {booking.flight?.origin} → {booking.flight?.destination}
                      </p>
                      <p className="text-xs text-slate-500">{booking.flight?.flight_no}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full capitalize">
                    {booking.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                  <p>PNR: <span className="font-mono font-semibold">{booking.pnr_code}</span></p>
                  <p className="font-semibold text-sky-600">{formatCurrency(booking.total_price)}</p>
                  {booking.flight && (
                    <p className="col-span-2 text-xs text-slate-400">
                      {formatDateTime(booking.flight.departs_at)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <p className="text-slate-400">No cached bookings available offline.</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 text-sm font-medium">
            Try going back home
          </Link>
        </div>
      </div>
    </div>
  )
}
