'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plane, Menu, X, LogOut, BookOpen, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'
import { cn } from '@/lib/utils'

export function Navbar() {
  const { user } = useUserStore()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    setMobileOpen(false)
  }

  const navLinks = [
    { href: '/search', label: 'Search Flights', icon: Search },
    ...(user ? [{ href: '/bookings', label: 'My Bookings', icon: BookOpen }] : []),
  ]

  return (
    <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-90 transition-opacity">
            <Plane className="w-6 h-6 text-sky-400" />
            <span>FlySphere</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 truncate max-w-[150px]">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-sm text-slate-300 hover:text-white transition-colors px-3 py-1.5"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm bg-sky-500 hover:bg-sky-400 text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-700 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={cn(
        'md:hidden border-t border-slate-700 overflow-hidden transition-all duration-200',
        mobileOpen ? 'max-h-64' : 'max-h-0'
      )}>
        <div className="px-4 py-3 space-y-2">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white py-2 transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}

          <div className="pt-2 border-t border-slate-700">
            {user ? (
              <>
                <p className="text-xs text-slate-400 mb-2">{user.email}</p>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors py-1"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-slate-300 hover:text-white py-1"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-sky-400 hover:text-sky-300 py-1 font-medium"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
