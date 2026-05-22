import { createClient } from '@/lib/supabase/server'
import { FlightResultsList } from '@/components/flights/FlightResultsList'
import { Plane } from 'lucide-react'
import Link from 'next/link'
import type { SeatClass } from '@/types'

interface SearchResultsPageProps {
  searchParams: Promise<{
    origin?: string
    destination?: string
    date?: string
    passengers?: string
    class?: string
  }>
}

export default async function SearchResultsPage({ searchParams }: Readonly<SearchResultsPageProps>) {
  const params = await searchParams
  const { origin, destination, date, passengers, class: seatClass } = params

  if (!origin || !destination || !date) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Missing search parameters.</p>
          <Link href="/search" className="text-sky-600 hover:underline">Go back to search</Link>
        </div>
      </div>
    )
  }

  const supabase = await createClient()


  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const { data: flights, error } = await supabase
    .from('flights')
    .select('*')
    .eq('origin', origin)
    .eq('destination', destination)
    .gte('departs_at', startOfDay.toISOString())
    .lte('departs_at', endOfDay.toISOString())
    .neq('status', 'cancelled')
    .order('departs_at', { ascending: true })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Search summary bar */}
      <div className="bg-slate-900 text-white py-4 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <span>{origin}</span>
            <Plane className="w-4 h-4 text-sky-400 rotate-90" />
            <span>{destination}</span>
          </div>
          <span className="text-slate-400">·</span>
          <span className="text-slate-300">{new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-300">{passengers || 1} pax</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-300 capitalize">{seatClass || 'economy'}</span>
          <Link href="/search" className="ml-auto text-sky-400 hover:text-sky-300 text-sm underline underline-offset-2">
            Modify search
          </Link>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {error ? (
          <div className="text-center py-16">
            <p className="text-red-500">Failed to load flights. Please try again.</p>
          </div>
        ) : (
          <FlightResultsList
            flights={flights || []}
            seatClass={(seatClass as SeatClass) || 'economy'}
            passengers={Number(passengers) || 1}
          />
        )}
      </div>
    </div>
  )
}
