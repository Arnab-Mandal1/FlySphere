'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'
import { useFlightStore } from '@/lib/stores/useFlightStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, resetUser } = useUserStore()
  const { resetAll } = useFlightStore()

  useEffect(() => {
    const supabase = createClient()


    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })


    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)

        if (event === 'SIGNED_OUT') {
          resetUser()
          resetAll()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [setSession, resetUser, resetAll])

  return <>{children}</>
}
