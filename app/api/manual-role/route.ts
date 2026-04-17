import { NextRequest, NextResponse } from 'next/server'
import type { ScoreResult, GenerateResult } from '@/lib/types'

// Full pipeline: score + generate for a manual role submission
export async function POST(req: NextRequest) {
  try {
    const { jd_text, company, title, location, master_resume, fact_bank, role_key } =
      await req.json()

    if (!jd_text || !master_resume) {
      return NextResponse.json(
        { error: 'jd_text and master_resume are required' },
        { status: 400 }
      )
    }

    const base = req.nextUrl.origin

    // Step 1: Score the role
    let scoreRes: Response
    try {
      scoreRes = await fetch(`${base}/api/score-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd_text, master_resume, is_manual: true }),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('manual-role: score fetch failed:', msg)
      return NextResponse.json({ error: `Scoring request failed: ${msg}` }, { status: 500 })
    }

    if (!scoreRes.ok) {
      const errBody = await scoreRes.json().catch(() => ({}))
      const msg = errBody.error ?? `Score API returned ${scoreRes.status}`
      console.error('manual-role: score error:', msg)
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const score_result = (await scoreRes.json()) as ScoreResult

    // Step 2: Generate resume
    let genRes: Response
    try {
      genRes = await fetch(`${base}/api/generate-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd_text,
          master_resume,
          fact_bank,
          score_result,
          company: company ?? 'Unknown Company',
          title: title ?? 'Unknown Title',
          location,
        }),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('manual-role: generate fetch failed:', msg)
      return NextResponse.json({ error: `Generation request failed: ${msg}` }, { status: 500 })
    }

    if (!genRes.ok) {
      const errBody = await genRes.json().catch(() => ({}))
      const msg = errBody.error ?? `Generate API returned ${genRes.status}`
      console.error('manual-role: generate error:', msg)
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const generate_result = (await genRes.json()) as GenerateResult

    return NextResponse.json({ score_result, generate_result, role_key })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('manual-role unexpected error:', msg)
    return NextResponse.json({ error: `Pipeline error: ${msg}` }, { status: 500 })
  }
}
