import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface WorkoutParseResult {
  activity_type: 'lifting' | 'boxing' | 'hiit' | 'walking' | 'treadmill' | 'chores' | 'other'
  minutes: number
  intensity: 'low' | 'moderate' | 'high'
  summary: string
  exercises: string[]
  calories_burned: number
  is_pr: boolean
  pr_notes: string
}

type SupportedMime = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

interface ImagePayload {
  imageBase64: string
  mimeType: SupportedMime
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { images: ImagePayload[] }
    const { images } = body

    if (!images?.length) {
      return Response.json({ error: 'No images provided' }, { status: 400 })
    }

    // Build content blocks: each image followed by a label
    const imageBlocks: Anthropic.ImageBlockParam[] = images.map((img) => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mimeType,
        data: img.imageBase64,
      },
    }))

    // Interleave image blocks with screenshot labels
    const contentBlocks: Anthropic.ContentBlockParam[] = []
    images.forEach((_, i) => {
      contentBlocks.push(imageBlocks[i])
      if (images.length > 1) {
        contentBlocks.push({
          type: 'text',
          text: `[Screenshot ${i + 1} of ${images.length}]`,
        })
      }
    })

    contentBlocks.push({
      type: 'text',
      text: `Analyze ${images.length > 1 ? 'all these workout screenshots together' : 'this workout screenshot'} and extract the full workout data.

Important things to look for:
- Any mention of "PR", "Personal Record", "1RM", "personal best", star/medal icons, or highlighted achievements — these indicate a personal record
- Max effort sets, failure sets, or notes indicating this was a peak performance day
- The app's own calorie burn estimate if shown — use that if available
- Total workout duration from the app if shown

Return ONLY a valid JSON object with exactly these fields:
{
  "activity_type": one of: "lifting", "boxing", "hiit", "walking", "treadmill", "chores", "other",
  "minutes": total duration as an integer (estimate from sets/exercises if not shown explicitly),
  "intensity": one of: "low", "moderate", "high",
  "calories_burned": estimated calories burned as an integer (use app's number if shown; otherwise estimate from activity type, duration, and intensity — a PR or max-effort day burns 10-20% more),
  "summary": a 1-2 sentence plain-English description of the workout (e.g. "Upper body strength session — bench press, rows, and shoulder press. Hit a new bench press PR at 185 lbs."),
  "exercises": array of up to 12 exercise name strings,
  "is_pr": true if any personal record, max lift, or notable achievement was detected — otherwise false,
  "pr_notes": if is_pr is true, describe the PR in one short sentence (e.g. "New bench press 1RM: 185 lbs") — empty string if no PR
}

No markdown, no explanation, just the JSON.`,
    })

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: contentBlocks }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const data = JSON.parse(clean) as WorkoutParseResult

    data.minutes = Math.max(1, Math.min(300, Math.round(data.minutes)))
    data.calories_burned = Math.max(0, Math.round(data.calories_burned))

    return Response.json({ data })
  } catch (err) {
    console.error('[parse-workout]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
