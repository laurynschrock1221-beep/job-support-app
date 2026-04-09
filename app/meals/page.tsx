'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  getDraftMeals,
  getDailyLog,
  getLoggedMeals,
  getActivityLogs,
  getHydrationLogs,
  getSettings,
  saveLoggedMeal,
  saveDraftMeal,
  generateId,
  todayDate,
} from '@/lib/storage'
import { estimateMacros, confidenceLabel } from '@/lib/estimate'
import { computeDayTotals } from '@/lib/compute'
import type { DraftMeal, LoggedMeal, DayTotals } from '@/lib/types'

type Tab = 'drafts' | 'manual'

function MacroChip({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="bg-slate-800 rounded-lg px-3 py-2 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-bold text-sm">
        {value}
        <span className="text-slate-500 text-xs">{unit}</span>
      </p>
    </div>
  )
}

function DayImpactPreview({
  totals,
  pending,
  calTarget,
  proTarget,
}: {
  totals: DayTotals
  pending: { cal: number; prot: number; carbs: number; fat: number }
  calTarget: number
  proTarget: number
}) {
  const carbTarget = Math.round((calTarget * 0.4) / 4)
  const fatTarget = Math.round((calTarget * 0.3) / 9)

  const rows = [
    { label: 'Calories', current: totals.calories, add: pending.cal, target: calTarget, unit: '', baseColor: 'bg-emerald-600', addColor: 'bg-emerald-400' },
    { label: 'Protein', current: totals.protein, add: pending.prot, target: proTarget, unit: 'g', baseColor: 'bg-amber-600', addColor: 'bg-amber-400' },
    { label: 'Carbs', current: totals.carbs, add: pending.carbs, target: carbTarget, unit: 'g', baseColor: 'bg-blue-600', addColor: 'bg-blue-400' },
    { label: 'Fat', current: totals.fat, add: pending.fat, target: fatTarget, unit: 'g', baseColor: 'bg-purple-600', addColor: 'bg-purple-400' },
  ]

  return (
    <div className="bg-slate-900 border border-emerald-800/40 rounded-2xl p-4 space-y-3">
      <p className="text-xs text-emerald-400 uppercase tracking-wider font-medium">Day Impact Preview</p>
      {rows.map((row) => {
        const newTotal = row.current + row.add
        const remaining = Math.max(0, row.target - newTotal)
        const overBy = Math.max(0, newTotal - row.target)
        const basePct = row.target > 0 ? Math.min(100, (row.current / row.target) * 100) : 0
        const addPct = row.target > 0 ? Math.min(100 - basePct, (row.add / row.target) * 100) : 0

        return (
          <div key={row.label} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">{row.label}</span>
              <span className="tabular-nums">
                <span className="text-slate-500">{row.current}</span>
                {row.add > 0 && <span className="text-emerald-400"> +{row.add}</span>}
                <span className="text-slate-500"> → </span>
                <span className={`font-semibold ${overBy > 0 ? 'text-red-400' : 'text-white'}`}>{newTotal}</span>
                <span className="text-slate-600">/{row.target}{row.unit}</span>
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
              <div className={`h-full ${row.baseColor} transition-all duration-300`} style={{ width: `${basePct}%` }} />
              <div className={`h-full ${row.addColor} opacity-75 transition-all duration-300`} style={{ width: `${addPct}%` }} />
            </div>
            <p className="text-xs">
              {overBy > 0 ? (
                <span className="text-red-400">Over by {overBy}{row.unit}</span>
              ) : remaining > 0 ? (
                <span className="text-slate-600">{remaining}{row.unit} remaining after</span>
              ) : (
                <span className="text-emerald-400">Target hit</span>
              )}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export default function AddMealPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('drafts')
  const [mounted, setMounted] = useState(false)
  const [drafts, setDrafts] = useState<DraftMeal[]>([])
  const [search, setSearch] = useState('')
  const [dayTotals, setDayTotals] = useState<DayTotals | null>(null)
  const [calTarget, setCalTarget] = useState(1600)
  const [proTarget, setProTarget] = useState(120)

  const [selectedDraft, setSelectedDraft] = useState<DraftMeal | null>(null)
  const [draftCalories, setDraftCalories] = useState('')
  const [draftProtein, setDraftProtein] = useState('')
  const [draftCarbs, setDraftCarbs] = useState('')
  const [draftFat, setDraftFat] = useState('')
  const [draftNotes, setDraftNotes] = useState('')

  const [mealName, setMealName] = useState('')
  const [ingredientText, setIngredientText] = useState('')
  const [manualCal, setManualCal] = useState('')
  const [manualProt, setManualProt] = useState('')
  const [manualCarbs, setManualCarbs] = useState('')
  const [manualFat, setManualFat] = useState('')
  const [estimated, setEstimated] = useState<ReturnType<typeof estimateMacros> | null>(null)
  const [estimateNotes, setEstimateNotes] = useState<string>('')
  const [estimating, setEstimating] = useState(false)
  const [saveAsDraft, setSaveAsDraft] = useState(false)
  const [mealType, setMealType] = useState<DraftMeal['meal_type']>('lunch')

  useEffect(() => {
    const init = async () => {
      setMounted(true)
      const date = todayDate()
      const [draftList, settings, log, meals, activities, hydration] = await Promise.all([
        getDraftMeals(),
        getSettings(),
        getDailyLog(date),
        getLoggedMeals(date),
        getActivityLogs(date),
        getHydrationLogs(date),
      ])
      setDrafts(draftList)
      setDayTotals(computeDayTotals(log, meals, activities, hydration, settings))
      setCalTarget(log?.calorie_target_max ?? settings.calorie_target_max)
      setProTarget(log?.protein_target_min ?? settings.protein_target_min)
    }
    void init()
  }, [])

  const filteredDrafts = drafts.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.tags.some((t) => t.includes(search.toLowerCase())),
  )

  const handleSelectDraft = (draft: DraftMeal) => {
    setSelectedDraft(draft)
    setDraftCalories(draft.estimated_calories.toString())
    setDraftProtein(draft.estimated_protein.toString())
    setDraftCarbs(draft.estimated_carbs.toString())
    setDraftFat(draft.estimated_fat.toString())
    setDraftNotes('')
  }

  const handleLogDraft = async () => {
    if (!selectedDraft) return
    const meal: LoggedMeal = {
      id: generateId(),
      date: todayDate(),
      time: new Date().toTimeString().slice(0, 5),
      linked_draft_meal_id: selectedDraft.id,
      meal_name: selectedDraft.name,
      ingredient_text: selectedDraft.ingredient_list,
      estimated_calories: parseInt(draftCalories) || selectedDraft.estimated_calories,
      estimated_protein: parseInt(draftProtein) || selectedDraft.estimated_protein,
      estimated_carbs: parseInt(draftCarbs) || selectedDraft.estimated_carbs,
      estimated_fat: parseInt(draftFat) || selectedDraft.estimated_fat,
      notes: draftNotes || undefined,
    }
    await saveLoggedMeal(meal)
    router.push('/')
  }

  const handleEstimate = async () => {
    if (!ingredientText.trim()) return
    setEstimating(true)
    setEstimateNotes('')
    try {
      const res = await fetch('/api/parse-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: ingredientText }),
      })
      if (!res.ok) throw new Error('API error')
      const json = await res.json() as { data?: { calories: number; protein: number; carbs: number; fat: number; confidence: 'high' | 'medium' | 'low'; notes: string }; error?: string }
      if (!json.data) throw new Error(json.error ?? 'No data returned')
      const { calories, protein, carbs, fat, confidence, notes } = json.data
      setEstimated({ calories, protein, carbs, fat, confidence, parsed_items: [] })
      setManualCal(calories.toString())
      setManualProt(protein.toString())
      setManualCarbs(carbs.toString())
      setManualFat(fat.toString())
      setEstimateNotes(notes ?? '')
    } catch {
      const est = estimateMacros(ingredientText)
      setEstimated(est)
      setManualCal(est.calories.toString())
      setManualProt(est.protein.toString())
      setManualCarbs(est.carbs.toString())
      setManualFat(est.fat.toString())
      setEstimateNotes('')
    } finally {
      setEstimating(false)
    }
  }

  const handleLogManual = async () => {
    const name = mealName.trim() || 'Custom Meal'
    const meal: LoggedMeal = {
      id: generateId(),
      date: todayDate(),
      time: new Date().toTimeString().slice(0, 5),
      meal_name: name,
      ingredient_text: ingredientText.trim(),
      estimated_calories: parseInt(manualCal) || 0,
      estimated_protein: parseInt(manualProt) || 0,
      estimated_carbs: parseInt(manualCarbs) || 0,
      estimated_fat: parseInt(manualFat) || 0,
    }
    await saveLoggedMeal(meal)

    if (saveAsDraft) {
      const draft: DraftMeal = {
        id: generateId(),
        name,
        meal_type: mealType,
        ingredient_list: ingredientText.trim(),
        estimated_calories: meal.estimated_calories,
        estimated_protein: meal.estimated_protein,
        estimated_carbs: meal.estimated_carbs,
        estimated_fat: meal.estimated_fat,
        tags: [mealType],
        favorite: false,
        created_at: new Date().toISOString(),
      }
      await saveDraftMeal(draft)
    }

    router.push('/')
  }

  if (!mounted) return null

  const draftPending =
    tab === 'drafts' && selectedDraft
      ? { cal: parseInt(draftCalories) || 0, prot: parseInt(draftProtein) || 0, carbs: parseInt(draftCarbs) || 0, fat: parseInt(draftFat) || 0 }
      : null

  const manualPending =
    tab === 'manual' && (manualCal || manualProt || manualCarbs || manualFat)
      ? { cal: parseInt(manualCal) || 0, prot: parseInt(manualProt) || 0, carbs: parseInt(manualCarbs) || 0, fat: parseInt(manualFat) || 0 }
      : null

  return (
    <div className="px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold">Add Meal</h1>
        <p className="text-slate-400 text-sm">Log to today</p>
      </div>

      <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
        {(['drafts', 'manual'] as Tab[]).map((t) => (
          <button key={t} onClick={() => { setTab(t); setSelectedDraft(null) }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t === 'drafts' ? '📋 Saved Meals' : '✏️ Free Text'}
          </button>
        ))}
      </div>

      {tab === 'drafts' && !selectedDraft && (
        <div className="space-y-3">
          <input type="search" placeholder="Search meals or tags..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" />
          {filteredDrafts.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No saved meals yet.{' '}
              <button onClick={() => setTab('manual')} className="text-emerald-400 hover:underline">Create one</button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDrafts.map((draft) => (
                <button key={draft.id} onClick={() => handleSelectDraft(draft)}
                  className="w-full text-left bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-emerald-800 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{draft.name}</p>
                        {draft.favorite && <span className="text-amber-400 text-xs">★</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{draft.ingredient_list}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm">{draft.estimated_calories} cal</p>
                      <p className="text-xs text-slate-500">{draft.estimated_protein}g P</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {draft.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'drafts' && selectedDraft && (
        <div className="space-y-4">
          <button onClick={() => setSelectedDraft(null)} className="text-slate-400 text-sm hover:text-white flex items-center gap-1">
            ← Back to meals
          </button>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold">{selectedDraft.name}</h2>
            <p className="text-sm text-slate-400">{selectedDraft.ingredient_list}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Edit macros if portions changed</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Calories', value: draftCalories, set: setDraftCalories },
                { label: 'Protein (g)', value: draftProtein, set: setDraftProtein },
                { label: 'Carbs (g)', value: draftCarbs, set: setDraftCarbs },
                { label: 'Fat (g)', value: draftFat, set: setDraftFat },
              ].map(({ label, value, set }) => (
                <div key={label} className="space-y-1">
                  <label className="text-xs text-slate-500">{label}</label>
                  <input type="number" value={value} onChange={(e) => set(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Notes (optional)</label>
              <input type="text" value={draftNotes} onChange={(e) => setDraftNotes(e.target.value)}
                placeholder="e.g. added extra cheese"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          {dayTotals && draftPending && Object.values(draftPending).some((v) => v > 0) && (
            <DayImpactPreview totals={dayTotals} pending={draftPending} calTarget={calTarget} proTarget={proTarget} />
          )}
          <button onClick={() => void handleLogDraft()}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-4 rounded-2xl transition-colors">
            Log Meal
          </button>
        </div>
      )}

      {tab === 'manual' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500 uppercase tracking-wider">Meal name</label>
              <input type="text" value={mealName} onChange={(e) => setMealName(e.target.value)}
                placeholder="e.g. Street Taco Dinner"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500 uppercase tracking-wider">Ingredients / description</label>
              <textarea value={ingredientText}
                onChange={(e) => { setIngredientText(e.target.value); setEstimated(null); setEstimateNotes('') }}
                placeholder="e.g. 2 eggs, 1 flour tortilla, 1 oz chorizo, salsa&#10;or: 1 chicken street taco, handful of chips, some queso"
                rows={4}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 resize-none" />
            </div>
            <button onClick={handleEstimate} disabled={!ingredientText.trim() || estimating}
              className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
              {estimating ? 'Estimating...' : 'Estimate Macros'}
            </button>
          </div>

          {estimated && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Estimated</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${estimated.confidence === 'high' ? 'bg-emerald-900/40 text-emerald-400' : estimated.confidence === 'medium' ? 'bg-amber-900/40 text-amber-400' : 'bg-red-900/40 text-red-400'}`}>
                  {confidenceLabel(estimated.confidence)}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <MacroChip label="Cal" value={parseInt(manualCal) || 0} unit="" />
                <MacroChip label="Protein" value={parseInt(manualProt) || 0} unit="g" />
                <MacroChip label="Carbs" value={parseInt(manualCarbs) || 0} unit="g" />
                <MacroChip label="Fat" value={parseInt(manualFat) || 0} unit="g" />
              </div>
              {estimateNotes && <p className="text-xs italic text-slate-400">{estimateNotes}</p>}
              <p className="text-xs text-slate-500 uppercase tracking-wider">Edit if needed</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Calories', value: manualCal, set: setManualCal },
                  { label: 'Protein (g)', value: manualProt, set: setManualProt },
                  { label: 'Carbs (g)', value: manualCarbs, set: setManualCarbs },
                  { label: 'Fat (g)', value: manualFat, set: setManualFat },
                ].map(({ label, value, set }) => (
                  <div key={label} className="space-y-1">
                    <label className="text-xs text-slate-500">{label}</label>
                    <input type="number" value={value} onChange={(e) => set(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!estimated && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Or enter macros manually</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Calories', value: manualCal, set: setManualCal },
                  { label: 'Protein (g)', value: manualProt, set: setManualProt },
                  { label: 'Carbs (g)', value: manualCarbs, set: setManualCarbs },
                  { label: 'Fat (g)', value: manualFat, set: setManualFat },
                ].map(({ label, value, set }) => (
                  <div key={label} className="space-y-1">
                    <label className="text-xs text-slate-500">{label}</label>
                    <input type="number" value={value} onChange={(e) => set(e.target.value)} placeholder="0"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <button type="button" onClick={() => setSaveAsDraft(!saveAsDraft)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${saveAsDraft ? 'bg-emerald-900/30 border-emerald-700 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
              <span className="text-sm font-medium">Save as draft meal for future use</span>
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${saveAsDraft ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                {saveAsDraft && <span className="text-white text-xs">✓</span>}
              </span>
            </button>
            {saveAsDraft && (
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Meal type</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((t) => (
                    <button key={t} onClick={() => setMealType(t)}
                      className={`py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${mealType === t ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {dayTotals && manualPending && Object.values(manualPending).some((v) => v > 0) && (
            <DayImpactPreview totals={dayTotals} pending={manualPending} calTarget={calTarget} proTarget={proTarget} />
          )}

          <button onClick={() => void handleLogManual()} disabled={!ingredientText.trim() && !manualCal}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white font-semibold py-4 rounded-2xl transition-colors">
            Log Meal
          </button>
        </div>
      )}
    </div>
  )
}
