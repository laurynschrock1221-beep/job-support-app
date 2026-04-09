'use client'

import { useState, useEffect } from 'react'
import { getSettings, saveSettings, getDailyLog, saveDailyLog, todayDate, DEFAULT_SETTINGS } from '@/lib/storage'
import type { UserSettings } from '@/lib/types'

function Field({
  label,
  sub,
  value,
  onChange,
  placeholder,
  type = 'number',
}: {
  label: string
  sub?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div className="space-y-1">
      <div>
        <label className="text-sm font-medium text-slate-300">{label}</label>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
      />
    </div>
  )
}

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  const [saved, setSaved] = useState(false)

  const [name, setName] = useState('')
  const [currentBfPct, setCurrentBfPct] = useState('')
  const [goalBfPct, setGoalBfPct] = useState('')
  const [tdee, setTdee] = useState('')
  const [weightLbs, setWeightLbs] = useState('')
  const [heightInches, setHeightInches] = useState('')
  const [calMin, setCalMin] = useState('')
  const [calMax, setCalMax] = useState('')
  const [protMin, setProtMin] = useState('')
  const [protMax, setProtMax] = useState('')
  const [carbTarget, setCarbTarget] = useState('')
  const [fatTarget, setFatTarget] = useState('')
  const [hydTarget, setHydTarget] = useState('')
  const [stepGoal, setStepGoal] = useState('')

  useEffect(() => {
    const init = async () => {
      setMounted(true)
      const s = await getSettings()
      setName(s.name ?? '')
      setCurrentBfPct(s.current_bf_pct?.toString() ?? '')
      setGoalBfPct(s.goal_bf_pct?.toString() ?? '')
      setTdee(s.tdee?.toString() ?? '')
      setWeightLbs(s.weight_lbs?.toString() ?? '')
      setHeightInches(s.height_inches?.toString() ?? '')
      setCalMin(s.calorie_target_min.toString())
      setCalMax(s.calorie_target_max.toString())
      setProtMin(s.protein_target_min.toString())
      setProtMax(s.protein_target_max.toString())
      setCarbTarget(s.carb_target_g?.toString() ?? '')
      setFatTarget(s.fat_target_g?.toString() ?? '')
      setHydTarget(s.hydration_target_oz.toString())
      setStepGoal((s.step_goal ?? 8000).toString())
    }
    void init()
  }, [])

  const handleSave = async () => {
    const settings: UserSettings = {
      name: name.trim() || undefined,
      current_bf_pct: parseFloat(currentBfPct) || undefined,
      goal_bf_pct: parseFloat(goalBfPct) || undefined,
      bf_measured_date: parseFloat(currentBfPct) ? new Date().toISOString().split('T')[0] : undefined,
      tdee: parseInt(tdee) || undefined,
      weight_lbs: parseFloat(weightLbs) || undefined,
      height_inches: parseFloat(heightInches) || undefined,
      calorie_target_min: parseInt(calMin) || DEFAULT_SETTINGS.calorie_target_min,
      calorie_target_max: parseInt(calMax) || DEFAULT_SETTINGS.calorie_target_max,
      protein_target_min: parseInt(protMin) || DEFAULT_SETTINGS.protein_target_min,
      protein_target_max: parseInt(protMax) || DEFAULT_SETTINGS.protein_target_max,
      carb_target_g: parseInt(carbTarget) || undefined,
      fat_target_g: parseInt(fatTarget) || undefined,
      hydration_target_oz: parseInt(hydTarget) || DEFAULT_SETTINGS.hydration_target_oz,
      step_goal: parseInt(stepGoal) || DEFAULT_SETTINGS.step_goal,
    }
    await saveSettings(settings)

    // Push new targets into today's log so Today page reflects immediately
    const todayLog = await getDailyLog(todayDate())
    if (todayLog) {
      await saveDailyLog({
        ...todayLog,
        calorie_target_min: settings.calorie_target_min,
        calorie_target_max: settings.calorie_target_max,
        protein_target_min: settings.protein_target_min,
        protein_target_max: settings.protein_target_max,
        hydration_target_oz: settings.hydration_target_oz,
      })
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setCalMin(DEFAULT_SETTINGS.calorie_target_min.toString())
    setCalMax(DEFAULT_SETTINGS.calorie_target_max.toString())
    setProtMin(DEFAULT_SETTINGS.protein_target_min.toString())
    setProtMax(DEFAULT_SETTINGS.protein_target_max.toString())
    setHydTarget(DEFAULT_SETTINGS.hydration_target_oz.toString())
    setStepGoal((DEFAULT_SETTINGS.step_goal).toString())
  }

  if (!mounted) return null

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-slate-400 text-sm">Default daily targets</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div>
          <h2 className="font-semibold text-sm uppercase tracking-wider text-slate-400">Goal</h2>
          <p className="text-xs text-slate-600 mt-1">
            Body composition focus — not scale weight. Coaching and trend analysis will work toward this.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Current body fat %" sub="Your most recent measurement" value={currentBfPct} onChange={setCurrentBfPct} placeholder="e.g. 28" />
          <Field label="Goal body fat %" sub="Target composition" value={goalBfPct} onChange={setGoalBfPct} placeholder="e.g. 22" />
        </div>
        <p className="text-xs text-slate-600">
          Update current % whenever you re-measure. The date is recorded automatically so the app knows how recent it is.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-slate-400">Personal</h2>
        <Field label="Your name" sub="Used in the app header" value={name} onChange={setName} type="text" placeholder="Optional" />
        <Field label="Your TDEE" sub="Maintenance calories at your current weight" value={tdee} onChange={setTdee} placeholder="e.g. 1550" />
        <p className="text-xs text-slate-600 -mt-2">
          Used to calculate your deficit on the Trends page. Adapts automatically as your weight changes.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Current weight" sub="lbs — TDEE reference point" value={weightLbs} onChange={setWeightLbs} placeholder="e.g. 160" />
          <Field label="Height" sub="inches total (e.g. 65)" value={heightInches} onChange={setHeightInches} placeholder="e.g. 65" />
        </div>
        <p className="text-xs text-slate-600 -mt-2">Update weight here when you want to reset the TDEE reference point.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-slate-400">Calorie Targets</h2>
        <p className="text-xs text-slate-500">These are your default targets. You can override them in the daily check-in.</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Min calories" sub="Lower bound" value={calMin} onChange={setCalMin} placeholder="1400" />
          <Field label="Max calories" sub="Upper bound" value={calMax} onChange={setCalMax} placeholder="1600" />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-slate-400">Macro Targets</h2>
        <p className="text-xs text-slate-500">Baseline targets for a moderate training day. Carbs and calories adjust automatically on rest and high-output days.</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Min protein" sub="grams/day" value={protMin} onChange={setProtMin} placeholder="120" />
          <Field label="Max protein" sub="grams/day" value={protMax} onChange={setProtMax} placeholder="140" />
          <Field label="Carbs" sub="grams/day (moderate)" value={carbTarget} onChange={setCarbTarget} placeholder="auto from calories" />
          <Field label="Fat" sub="grams/day (moderate)" value={fatTarget} onChange={setFatTarget} placeholder="auto from calories" />
        </div>
        <p className="text-xs text-slate-600">Leave carbs/fat blank to auto-calculate from your calorie target (40% carbs, fills rest with fat).</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-slate-400">Activity & Hydration</h2>
        <Field label="Hydration target" sub="ounces per day" value={hydTarget} onChange={setHydTarget} placeholder="80" />
        <Field label="Daily step goal" sub="estimated steps" value={stepGoal} onChange={setStepGoal} placeholder="8000" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-slate-400">About</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          All data is synced to your Supabase account and accessible from any device.
        </p>
        <p className="text-xs text-slate-600">Nutrition Tracker · V2</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => void handleSave()}
          className={`w-full font-semibold py-4 rounded-2xl transition-all text-base ${saved ? 'bg-emerald-600 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-white'}`}
        >
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
        <button onClick={handleReset} className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white py-3 rounded-2xl transition-colors text-sm">
          Reset to defaults
        </button>
      </div>
    </div>
  )
}
