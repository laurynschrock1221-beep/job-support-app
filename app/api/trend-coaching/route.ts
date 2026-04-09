import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface TrendCoachingRequest {
  days_logged: number
  avg_calories: number
  avg_protein: number
  avg_weight?: number
  est_deficit: number
  effective_tdee: number
  weight_points: { date: string; weight?: number; rolling_avg?: number }[]
  cal_target_min: number
  cal_target_max: number
  pro_target: number
  tdee?: number
  weight_lbs?: number
  // Goal context
  goal_bf_pct?: number
  current_bf_pct?: number
  estimated_bf_now?: number
  fat_to_lose_lbs?: number
  lean_mass_lbs?: number
  weeks_to_goal?: number
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as TrendCoachingRequest

    const {
      days_logged,
      avg_calories,
      avg_protein,
      avg_weight,
      est_deficit,
      effective_tdee,
      weight_points,
      cal_target_min,
      cal_target_max,
      pro_target,
      tdee,
      weight_lbs,
      goal_bf_pct,
      current_bf_pct,
      estimated_bf_now,
      fat_to_lose_lbs,
      lean_mass_lbs,
      weeks_to_goal,
    } = body

    // Build weight trend summary
    const weightWithData = weight_points.filter((p) => p.weight != null)
    let weightTrendSummary = 'No weight data logged yet.'
    if (weightWithData.length >= 2) {
      const first = weightWithData.slice(0, 3)
      const last = weightWithData.slice(-3)
      const firstAvg = first.reduce((s, p) => s + p.weight!, 0) / first.length
      const lastAvg = last.reduce((s, p) => s + p.weight!, 0) / last.length
      const diff = lastAvg - firstAvg
      const direction = diff < -0.2 ? 'down' : diff > 0.2 ? 'up' : 'stable'
      weightTrendSummary = `Weight trending ${direction} ~${Math.abs(diff).toFixed(1)} lbs over ${weightWithData.length} weigh-ins. ` +
        `Most recent: ${weightWithData.at(-1)!.weight} lbs. ` +
        (weightWithData.at(-1)?.rolling_avg ? `7-day rolling avg: ${weightWithData.at(-1)!.rolling_avg} lbs.` : '')
    }

    const deficitLabel = est_deficit > 0
      ? `${est_deficit} cal/day average deficit`
      : `${Math.abs(est_deficit)} cal/day average surplus`

    const contextLines = [
      `Days with data in last 7: ${days_logged}`,
      `Average daily calories: ${avg_calories} (target: ${cal_target_min}–${cal_target_max})`,
      `Average daily protein: ${avg_protein}g (target: ${pro_target}g)`,
      avg_weight ? `Average weight this week: ${avg_weight} lbs` : 'No weight data this week',
      tdee ? `TDEE: ${tdee} cal (reference weight: ${weight_lbs ?? 'not set'} lbs)` : 'TDEE not set',
      `Effective maintenance: ${effective_tdee} cal — ${deficitLabel}`,
      `Weight trend: ${weightTrendSummary}`,
    ]

    if (goal_bf_pct) {
      const bfNow = estimated_bf_now ?? current_bf_pct
      contextLines.push(`Body composition goal: ${bfNow != null ? `~${bfNow}% BF estimated now` : `${current_bf_pct}% BF at last measurement`} → ${goal_bf_pct}% BF target`)
      if (fat_to_lose_lbs) contextLines.push(`Fat remaining to reach goal: ~${fat_to_lose_lbs} lbs`)
      if (lean_mass_lbs) contextLines.push(`Lean mass to preserve: ${lean_mass_lbs} lbs`)
      if (weeks_to_goal) contextLines.push(`Projected weeks to goal at current deficit: ${weeks_to_goal}`)
    }

    const context = contextLines.join('\n')

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: `You are an experienced nutrition and body composition coach analyzing a client's weekly data. Give 4–6 sentences of pattern-based coaching.

Rules:
- Identify what the data actually shows, not what you'd expect
- Call out specific numbers ("your protein averaged 20g below target 5 days this week")
- If weight is trending as expected given the deficit, validate it
- If weight isn't moving despite a deficit, suggest possible causes (retention, logging gaps, TDEE estimate)
- Give one concrete priority for the coming week
- If a body composition goal is set, frame the analysis around fat loss vs lean mass preservation — not scale weight. Mention if they're on/off pace for the goal.
- If fewer than 3 days are logged, note that the data is too sparse for reliable patterns and encourage more consistent logging
- No bullet points, no headers — flowing paragraph form only

Weekly data:
${context}

Respond with plain coaching text only.`,
        },
      ],
    })

    const recommendation =
      response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    return Response.json({ recommendation })
  } catch (err) {
    console.error('[trend-coaching]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
