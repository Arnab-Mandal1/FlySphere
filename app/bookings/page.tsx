import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookingsList } from '@/components/bookings/BookingsList'

export default async function BookingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/bookings')

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, flight:flights(*), seat:seats(*), passengers(*)')
    .eq('user_id', user.id)
    .order('booked_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">My Bookings</h1>
        <BookingsList initialBookings={bookings as never || []} />
      </div>
    </div>
  )
}
