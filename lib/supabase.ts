import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchWithTimeout },
})
