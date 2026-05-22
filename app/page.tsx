import Link from 'next/link'
import { Plane, Shield, Clock, CreditCard } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}

      <section className="bg-linear-to-br from-slate-900 via-slate-800 to-sky-900 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-sky-500/20 border border-sky-500/30 text-sky-300 text-sm px-4 py-1.5 rounded-full mb-6">
            <Plane className="w-4 h-4" />
            Book smarter. Fly better.
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Your journey starts
            <span className="text-sky-400 block">right here</span>
          </h1>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
            Search hundreds of flights, pick your perfect seat, and manage all your bookings in one place.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-lg px-8 py-4 rounded-xl transition-colors shadow-lg shadow-sky-500/25"
          >
            <Plane className="w-5 h-5" />
            Search Flights
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">Everything you need</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Secure Booking', desc: 'Row-level security ensures your data stays private. Atomic seat locks prevent double-booking.', color: 'text-green-500', bg: 'bg-green-50' },
              { icon: Clock, title: 'Real-time Seats', desc: 'Live seat availability via Supabase Realtime. See updates the moment another passenger books.', color: 'text-sky-500', bg: 'bg-sky-50' },
              { icon: CreditCard, title: 'Flexible Management', desc: 'Reschedule or cancel with ease. 2-hour departure policy enforced automatically.', color: 'text-purple-500', bg: 'bg-purple-50' },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="text-center p-6 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
                <div className={`inline-flex items-center justify-center w-14 h-14 ${bg} rounded-2xl mb-4`}>
                  <Icon className={`w-7 h-7 ${color}`} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Routes */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">Popular Routes</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { from: 'DEL', to: 'BOM', price: '₹4,500' },
              { from: 'BOM', to: 'BLR', price: '₹3,800' },
              { from: 'BLR', to: 'HYD', price: '₹2,900' },
              { from: 'HYD', to: 'DEL', price: '₹5,500' },
            ].map(({ from, to, price }) => (
              <Link key={`${from}-${to}`} href={`/search?origin=${from}&destination=${to}`}
                className="bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md rounded-xl p-4 text-center transition-all group">
                <div className="flex items-center justify-center gap-2 text-slate-700 font-bold text-lg mb-1 group-hover:text-sky-600 transition-colors">
                  <span>{from}</span>
                  <Plane className="w-4 h-4 text-sky-400 rotate-90" />
                  <span>{to}</span>
                </div>
                <p className="text-sm text-slate-400">from <span className="text-sky-600 font-semibold">{price}</span></p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
