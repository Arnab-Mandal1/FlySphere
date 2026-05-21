import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SeatMap } from '@/components/seats/SeatMap'
import { Plane, Clock } from 'lucide-react'
import { formatTime, formatDuration } from '@/lib/utils'
import type { Flight, Seat } from '@/types'

interface SeatMapPageProps {
  params: Promise<{ flightId: string }>
}

export default async function SeatMapPage({ params }: SeatMapPageProps) {
  const { flightId } = await params
  const supabase = await createClient()

  const { data: flight } = await supabase
    .from('flights')
    .select('*')
    .eq('id', flightId)
    .single()

  if (!flight) notFound()

  const { data: seats } = await supabase
    .from('seats')
    .select('*')
    .eq('flight_id', flightId)
    .order('seat_number', { ascending: true })

  const typedFlight = flight as unknown as Flight
  const typedSeats = (seats || []) as unknown as Seat[]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 text-white py-4 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 font-bold text-lg">
            <span>{typedFlight.origin}</span>
            <Plane className="w-4 h-4 text-sky-400 rotate-90" />
            <span>{typedFlight.destination}</span>
          </div>
          <span className="text-slate-400">·</span>
          <span className="text-slate-300">{typedFlight.flight_no}</span>
          <span className="text-slate-400">·</span>
          <div className="flex items-center gap-1 text-slate-300">
            <Clock className="w-4 h-4" />
            {formatTime(typedFlight.departs_at)} → {formatTime(typedFlight.arrives_at)}
            <span className="text-slate-400 ml-1">({formatDuration(typedFlight.departs_at, typedFlight.arrives_at)})</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Select your seat</h1>
          <p className="text-slate-500 text-sm">Tap a seat to select it. Prices shown are extra fees on top of base fare.</p>
        </div>
        <SeatMap flight={typedFlight} initialSeats={typedSeats} />
      </div>
    </div>
  )
}
