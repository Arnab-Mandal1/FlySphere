import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { Navbar } from '@/components/ui/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FlySphere — Book, Select, Fly',
  description: 'Search and book flights, select seats, manage your bookings.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FlySphere',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 min-h-screen`}>
        <AuthProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
