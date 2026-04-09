'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Nav from './Nav'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session && pathname !== '/auth') {
        router.replace('/auth')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (!s) router.replace('/auth')
    })

    return () => subscription.unsubscribe()
  }, [pathname, router])

  // Still checking auth — show nothing to avoid flash
  if (session === undefined) {
    return <div className="min-h-screen bg-slate-950" />
  }

  // Not logged in — render auth page without Nav
  if (!session) {
    return <>{children}</>
  }

  // Logged in — render app with Nav
  return (
    <>
      <main className="max-w-lg mx-auto pb-20 min-h-screen">{children}</main>
      <Nav />
    </>
  )
}
