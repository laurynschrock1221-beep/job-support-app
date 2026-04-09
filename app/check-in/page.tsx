'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  getDailyLog,
  saveDailyLog,
  getSettings,
  generateId,
  todayDate,
} from '@/lib/storage'
import type { DailyLog } from '@/lib/types'

function Slider({
  label,
  value,
  onChange,
  max = 5,
  labels,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  max?: number
  labels?: string[]
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="text-sm font-bold text-white bg-slate-800 px-2 py-0.5 rounded-lg min-w-8 text-center">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-emerald-500"
      />
      {labels && (
        <div className="flex justify-between text-xs text-slate-600">
          {labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
        value
          ? 'bg-emerald-900/30 border-emerald-700 text-emerald-300'
          : 'bg-slate-900 border-slate-800 text-slate-400'
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
        value ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
      }`}>
        {value && <span className="text-white text-xs">✓</span>}
      </span>
    </button>
  )
}

export default function CheckInPage() {
  const router = useRouter()
  const [date] = useState(todayDate)
  const [mounted, setMounted] = useState(false)

  const [weight, setWeight] = useState('')
  const [fatigueLevel, setFatigueLevel] = useState(0)
  const [sorenessLevel, setSorenessLevel] = useState(0)
  const [periodFlag, setPeriodFlag] = useState(false)
  const [restaurantFlag, setRestaurantFlag] = useState(false)
  const [notes, setNotes] = useState('')

  const [calMin, setCalMin] = useState('')
  const [calMax, setCalMax] = useState('')
  const [protMin, setProtMin] = useState('')
  const [protMax, setProtMax] = useState('')
  const [hydTarget, setHydTarget] = useState('')

  // Store the existing log id so we can reuse it on save
  const [existingId, setExistingId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      setMounted(true)
      const [settings, existing] = await Promise.all([getSettings(), getDailyLog(date)])
      if (existing) {
        setExistingId(existing.id ?? null)
        setWeight(existing.morning_weight?.toString() ?? '')
        setFatigueLevel(existing.fatigue_level)
        setSorenessLevel(existing.soreness_level)
        setPeriodFlag(existing.period_flag)
        setRestaurantFlag(existing.restaurant_meal_flag)
        setNotes(existing.notes ?? '')
        setCalMin(existing.calorie_target_min.toString())
        setCalMax(existing.calorie_target_max.toString())
        setProtMin(existing.protein_target_min.toString())
        setProtMax(existing.protein_target_max.toString())
        setHydTarget(existing.hydration_target_oz.toString())
      } else {
        setCalMin(settings.calorie_target_min.toString())
        setCalMax(settings.calorie_target_max.toString())
        setProtMin(settings.protein_target_min.toString())
        setProtMax(settings.protein_target_max.toString())
        setHydTarget(settings.hydration_target_oz.toString())
      }
    }
    void init()
  }, [date])

  const handleSave = async () => {
    const log: DailyLog = {
      id: existingId ?? generateId(),
      date,
      morning_weight: weight ? parseFloat(weight) : undefined,
      fatigue_level: fatigueLevel,
      soreness_level: sorenessLevel,
      period_flag: periodFlag,
      restaurant_meal_flag: restaurantFlag,
      notes: notes || undefined,
      calorie_target_min: parseInt(calMin) || 1400,
      calorie_target_max: parseInt(calMax) || 1600,
      protein_target_min: parseInt(protMin) || 120,
      protein_target_max: parseInt(protMax) || 140,
      hydration_target_oz: parseInt(hydTarget) || 80,
    }
    await saveDailyLog(log)
    router.push('/')
  }

  if (!mounted) return null

  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Daily Check-In</h1>
        <p className="text-slate-400 text-sm">{dateLabel}</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-slate-400">
          Morning Weight
        </h2>
        <div className="flex items-center gap-3">
          <input
            type="number"
            step="0.1"
            placeholder="e.g. 142.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <span className="text-slate-400 font-medium">lbs</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-5">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-slate-400">
          How Do You Feel?
        </h2>
        <Slider
          label="Fatigue"
          value={fatigueLevel}
          onChange={setFatigueLevel}
          labels={['None', '', 'Moderate', '', 'Exhausted']}
        />
        <Slider
          label="Soreness"
          value={sorenessLevel}
          onChange={setSorenessLevel}
          labels={['None', '', 'Moderate', '', 'Very sore']}
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-slate-400">
          Today&apos;s Context
        </h2>
        <Toggle label="Period / hormonal day" value={periodFlag} onChange={setPeriodFlag} />
        <Toggle label="Dinner out / restaurant planned" value={restaurantFlag} onChange={setRestaurantFlag} />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-slate-400">
          Today&apos;s Targets
          <span className="text-slate-600 text-xs normal-case ml-1">(override defaults)</span>
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Cal min</label>
            <input type="number" value={calMin} onChange={(e) => setCalMin(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Cal max</label>
            <input type="number" value={calMax} onChange={(e) => setCalMax(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Protein min (g)</label>
            <input type="number" value={protMin} onChange={(e) => setProtMin(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Protein max (g)</label>
            <input type="number" value={protMax} onChange={(e) => setProtMax(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-xs text-slate-500">Hydration target (oz)</label>
            <input type="number" value={hydTarget} onChange={(e) => setHydTarget(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
        <label className="text-sm text-slate-400 font-medium">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything else affecting today? Sleep, stress, travel..."
          rows={3}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>

      <button
        onClick={() => void handleSave()}
        className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-4 rounded-2xl transition-colors text-base"
      >
        Save Check-In
      </button>
    </div>
  )
}
