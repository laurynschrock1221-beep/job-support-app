import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface MealParseResult {
  calories: number
  protein: number
  carbs: number
  fat: number
  confidence: 'high' | 'medium' | 'low'
  notes: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { description: string }
    const { description } = body

    if (!description?.trim()) {
      return Response.json({ error: 'No description provided' }, { status: 400 })
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `You are a precise nutrition estimator. Analyze this meal or ingredient description and return accurate macro estimates.

Be conservative — it's better to slightly underestimate than overestimate. Use standard USDA-style values where possible.

For confidence:
- "high" = specific foods with specific quantities (e.g. "2 large eggs, 5oz grilled chicken")
- "medium" = specific foods with vague quantities, or well-known restaurant items
- "low" = very vague descriptions, unfamiliar dishes, or mostly unrecognizable items

Return ONLY valid JSON, no markdown:
{
  "calories": <integer>,
  "protein": <integer grams>,
  "carbs": <integer grams>,
  "fat": <integer grams>,
  "confidence": "high" | "medium" | "low",
  "notes": "<one sentence: key assumptions made or anything the user should know>"
}

Meal description: ${description}`,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const data = JSON.parse(clean) as MealParseResult

    // Clamp values to valid ranges
    data.calories = Math.max(0, Math.min(5000, Math.round(data.calories)))
    data.protein = Math.max(0, Math.min(500, Math.round(data.protein)))
    data.carbs = Math.max(0, Math.min(500, Math.round(data.carbs)))
    data.fat = Math.max(0, Math.min(500, Math.round(data.fat)))

    return Response.json({ data })
  } catch (err) {
    console.error('[parse-meal]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
