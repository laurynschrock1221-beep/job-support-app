import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface CoachingRequest {
  calories: number
  protein: number
  carbs: number
  fat: number
  hydration_oz: number
  day_type: 'rest' | 'moderate' | 'high-output'
  calories_remaining: number
  protein_remaining: number
  hydration_remaining: number
  cal_target_min: number
  cal_target_max: number
  pro_target: number
  hyd_target: number
  tdee?: number
  daily_deficit?: number
  recovery_flag: boolean
  retention_flag: boolean
  pr_today: boolean
  fatigue_level: number
  soreness_level: number
  period_flag: boolean
  restaurant_meal_flag: boolean
  hour: number
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
    const body = await request.json() as CoachingRequest

    const {
      calories,
      protein,
      carbs,
      fat,
      hydration_oz,
      day_type,
      calories_remaining,
      protein_remaining,
      hydration_remaining,
      cal_target_min,
      cal_target_max,
      pro_target,
      hyd_target,
      tdee,
      daily_deficit,
      recovery_flag,
      retention_flag,
      pr_today,
      fatigue_level,
      soreness_level,
      period_flag,
      restaurant_meal_flag,
      hour,
      goal_bf_pct,
      estimated_bf_now,
      current_bf_pct,
      fat_to_lose_lbs,
      lean_mass_lbs,
      weeks_to_goal,
    } = body

    const timeOfDay =
      hour < 6 ? 'early morning' :
      hour < 12 ? 'morning' :
      hour < 17 ? 'afternoon' :
      hour < 21 ? 'evening' :
      'night'

    const contextParts: string[] = [
      `Time of day: ${timeOfDay} (hour ${hour})`,
      `Day type: ${day_type}`,
      `Calories: ${calories} consumed / ${cal_target_min}–${cal_target_max} target (${calories_remaining} remaining to minimum)`,
      `Protein: ${protein}g consumed / ${pro_target}g target (${protein_remaining}g remaining)`,
      `Carbs: ${carbs}g, Fat: ${fat}g`,
      `Hydration: ${hydration_oz}oz consumed / ${hyd_target}oz target (${hydration_remaining}oz remaining)`,
    ]

    if (tdee != null) {
      contextParts.push(`TDEE: ${tdee} cal/day`)
    }
    if (daily_deficit != null) {
      const deficitLabel = daily_deficit >= 0 ? `${daily_deficit} cal deficit so far today` : `${Math.abs(daily_deficit)} cal surplus so far today`
      contextParts.push(`vs TDEE: ${deficitLabel}`)
    }

    const flags: string[] = []
    if (recovery_flag) flags.push('HIGH FATIGUE/SORENESS — recovery flag active')
    if (retention_flag) flags.push('water retention likely (period, restaurant meal, or intense lower-body training)')
    if (pr_today) flags.push('PR day — personal record achieved')
    if (period_flag) flags.push('menstrual cycle — scale weight may not reflect true fat/muscle changes')
    if (restaurant_meal_flag) flags.push('restaurant meal planned today')
    if (fatigue_level > 0) flags.push(`fatigue level ${fatigue_level}/5`)
    if (soreness_level > 0) flags.push(`soreness level ${soreness_level}/5`)

    if (flags.length > 0) {
      contextParts.push(`Flags: ${flags.join('; ')}`)
    }

    if (goal_bf_pct) {
      const bfNow = estimated_bf_now ?? current_bf_pct
      contextParts.push(
        `Body composition goal: ${bfNow != null ? `~${bfNow}% BF now` : `${current_bf_pct}% BF at last measurement`} → ${goal_bf_pct}% BF target`,
      )
      if (fat_to_lose_lbs) contextParts.push(`Fat to lose to reach goal: ~${fat_to_lose_lbs} lbs`)
      if (lean_mass_lbs) contextParts.push(`Lean mass to preserve: ${lean_mass_lbs} lbs`)
      if (weeks_to_goal) contextParts.push(`Estimated weeks to goal at current deficit: ${weeks_to_goal}`)
    }

    const context = contextParts.join('\n')

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `You are a direct, knowledgeable nutrition coach. Give 2–3 sentences of specific, actionable coaching based on this user's current day data.

Rules:
- Prioritize the single most important thing to address right now
- Be direct and specific — mention actual numbers when relevant (e.g. "you're 40g short on protein")
- Do NOT give generic advice if things are on track — acknowledge it and give a forward-looking tip instead
- Be time-aware: ${timeOfDay} advice should reflect what's realistic and useful at this time
- If recovery_flag is active, suggest a lighter approach and focus on rest, protein, and hydration
- If retention or period flags are active, note that scale weight may not reflect reality
- If a body composition goal is set, frame advice around preserving lean mass and losing fat — not just losing weight. Mention the goal when relevant.
- Keep it concise: 2–3 sentences maximum

Current data:
${context}

Respond with plain text coaching only — no bullet points, no headers, no markdown.`,
        },
      ],
    })

    const recommendation = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    return Response.json({ recommendation })
  } catch (err) {
    console.error('[coaching]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
