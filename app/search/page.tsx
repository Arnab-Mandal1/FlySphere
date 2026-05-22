'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plane, ArrowLeftRight, Calendar, Users, Search, Loader2 } from 'lucide-react'
import { useFlightStore } from '@/lib/stores/useFlightStore'
import { AIRPORT_CODES, cn } from '@/lib/utils'
import type { SeatClass } from '@/types'

const CLASS_OPTIONS: { value: SeatClass; label: string }[] = [
  { value: 'economy',  label: 'Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first',    label: 'First Class' },
]

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { searchQuery, setSearchQuery, setCurrentStep } = useFlightStore()

  const today = new Date().toISOString().split('T')[0]

  const [origin,      setOrigin]      = useState(searchParams.get('origin')      ?? searchQuery?.origin      ?? '')
  const [destination, setDestination] = useState(searchParams.get('destination') ?? searchQuery?.destination ?? '')
  const [date,        setDate]        = useState(searchQuery?.date  ?? today)
  const [passengers,  setPassengers]  = useState(searchQuery?.passengers ?? 1)
  const [seatClass,   setSeatClass]   = useState<SeatClass>(searchQuery?.class ?? 'economy')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => { setCurrentStep('search') }, [setCurrentStep])

  const handleSwap = () => {
    setOrigin(destination)
    setDestination(origin)
  }

  const handleSearch = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (origin === destination) {
      setError('Origin and destination cannot be the same')
      return
    }

    setLoading(true)
    const query = { origin, destination, date, passengers, class: seatClass }
    setSearchQuery(query)
    setCurrentStep('results')
    router.push(
      `/search/results?origin=${origin}&destination=${destination}&date=${date}&passengers=${passengers}&class=${seatClass}`
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800 pb-16">
      <div className="pt-12 pb-8 px-4 text-center text-white">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Find your flight</h1>
        <p className="text-slate-400">Search across all available routes and classes</p>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Origin / Destination */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label htmlFor="origin" className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Plane className="w-4 h-4 text-sky-500" /> From
                </span>
              </label>
              <select
                id="origin"
                required
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 bg-white"
              >
                <option value="">Select origin</option>
                {AIRPORT_CODES.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleSwap}
              className="self-center p-2.5 rounded-full border border-slate-200 hover:bg-slate-50 hover:border-sky-300 transition-colors text-slate-500 hover:text-sky-500"
              aria-label="Swap origin and destination"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>

            <div className="flex-1 w-full">
              <label htmlFor="destination" className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Plane className="w-4 h-4 text-sky-500 rotate-180" /> To
                </span>
              </label>
              <select
                id="destination"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 bg-white"
              >
                <option value="">Select destination</option>
                {AIRPORT_CODES.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date / Passengers / Class */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-sky-500" /> Date
                </span>
              </label>
              <input
                id="date"
                type="date"
                required
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="passengers" className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-500" /> Passengers
                </span>
              </label>
              <select
                id="passengers"
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 bg-white"
              >
                {[1,2,3,4,5,6].map((n) => (
                  <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="class" className="block text-sm font-medium text-slate-700 mb-1.5">
                Class
              </label>
              <select
                id="class"
                value={seatClass}
                onChange={(e) => setSeatClass(e.target.value as SeatClass)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 bg-white"
              >
                {CLASS_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              'w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25',
              loading && 'opacity-70 cursor-not-allowed'
            )}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {loading ? 'Searching…' : 'Search Flights'}
          </button>
        </form>
      </div>
    </div>
  )
}
