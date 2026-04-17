import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'NOT SET'
  const keySet = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace('Bearer ', '').trim()

  if (!token) {
    return NextResponse.json({
      supabase_url: url,
      anon_key_set: keySet,
      error: 'No auth token provided',
    })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  // Check user
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)

  // Try a select on application_tracker
  const { data: rows, error: selectError } = await supabase
    .from('application_tracker')
    .select('id')
    .limit(1)

  // Try a test insert
  const testId = 'debug-test-' + Date.now()
  const { error: insertError } = await supabase
    .from('application_tracker')
    .insert({
      id: testId,
      user_id: user?.id ?? '00000000-0000-0000-0000-000000000000',
      company: 'DEBUG TEST',
      title: 'DEBUG TEST',
      status: 'applied',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  // Clean up test row if inserted
  if (!insertError) {
    await supabase.from('application_tracker').delete().eq('id', testId)
  }

  return NextResponse.json({
    supabase_url: url,
    anon_key_set: keySet,
    user_id: user?.id ?? null,
    user_error: userError?.message ?? null,
    select_error: selectError?.message ?? null,
    select_worked: !selectError,
    insert_error: insertError?.message ?? null,
    insert_worked: !insertError,
  })
}
