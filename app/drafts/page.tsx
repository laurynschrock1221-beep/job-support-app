'use client'

import { useState, useEffect } from 'react'
import {
  getDraftMeals,
  saveDraftMeal,
  deleteDraftMeal,
  generateId,
} from '@/lib/storage'
import type { DraftMeal } from '@/lib/types'

const MEAL_TYPE_ICONS: Record<DraftMeal['meal_type'], string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🫐',
}

const COMMON_TAGS = [
  'high-protein', 'low-fat', 'rest-day', 'training-day',
  'lean', 'flexible-dinner', 'restaurant', 'quick',
]

function DraftForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: DraftMeal
  onSave: (d: DraftMeal) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [mealType, setMealType] = useState<DraftMeal['meal_type']>(initial?.meal_type ?? 'lunch')
  const [ingredients, setIngredients] = useState(initial?.ingredient_list ?? '')
  const [calories, setCalories] = useState(initial?.estimated_calories.toString() ?? '')
  const [protein, setProtein] = useState(initial?.estimated_protein.toString() ?? '')
  const [carbs, setCarbs] = useState(initial?.estimated_carbs.toString() ?? '')
  const [fat, setFat] = useState(initial?.estimated_fat.toString() ?? '')
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [tagInput, setTagInput] = useState('')

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const addCustomTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setTagInput('')
  }

  const handleSave = () => {
    if (!name.trim()) return
    const draft: DraftMeal = {
      id: initial?.id ?? generateId(),
      name: name.trim(),
      meal_type: mealType,
      ingredient_list: ingredients.trim(),
      estimated_calories: parseInt(calories) || 0,
      estimated_protein: parseInt(protein) || 0,
      estimated_carbs: parseInt(carbs) || 0,
      estimated_fat: parseInt(fat) || 0,
      tags,
      notes: notes || undefined,
      favorite: initial?.favorite ?? false,
      created_at: initial?.created_at ?? new Date().toISOString(),
    }
    onSave(draft)
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="space-y-1">
          <label className="text-xs text-slate-500 uppercase tracking-wider">Meal name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Breakfast Taco"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500 uppercase tracking-wider">Meal type</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((t) => (
              <button key={t} onClick={() => setMealType(t)}
                className={`py-2 rounded-lg text-xs font-medium capitalize transition-all flex flex-col items-center gap-0.5 ${mealType === t ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                <span>{MEAL_TYPE_ICONS[t]}</span>
                <span>{t}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
        <label className="text-xs text-slate-500 uppercase tracking-wider">Ingredients</label>
        <textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)}
          placeholder="e.g. 2 scrambled eggs, 1 flour tortilla, 1 oz chorizo, salsa"
          rows={3}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 resize-none" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <label className="text-xs text-slate-500 uppercase tracking-wider">Macros</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Calories', value: calories, set: setCalories },
            { label: 'Protein (g)', value: protein, set: setProtein },
            { label: 'Carbs (g)', value: carbs, set: setCarbs },
            { label: 'Fat (g)', value: fat, set: setFat },
          ].map(({ label, value, set }) => (
            <div key={label} className="space-y-1">
              <label className="text-xs text-slate-500">{label}</label>
              <input type="number" value={value} onChange={(e) => set(e.target.value)} placeholder="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <label className="text-xs text-slate-500 uppercase tracking-wider">Tags</label>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_TAGS.map((tag) => (
            <button key={tag} onClick={() => toggleTag(tag)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${tags.includes(tag) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
              {tag}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomTag()} placeholder="Add custom tag..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500" />
          <button onClick={addCustomTag} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg text-xs text-white">Add</button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="text-xs bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                {tag}
                <button onClick={() => toggleTag(tag)} className="hover:text-red-400">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
        <label className="text-xs text-slate-500 uppercase tracking-wider">Notes (optional)</label>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Any prep notes or reminders..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" />
      </div>

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-4 rounded-2xl transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={!name.trim()} className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white font-semibold py-4 rounded-2xl transition-colors">Save Draft</button>
      </div>
    </div>
  )
}

export default function DraftsPage() {
  const [mounted, setMounted] = useState(false)
  const [drafts, setDrafts] = useState<DraftMeal[]>([])
  const [editing, setEditing] = useState<DraftMeal | null | 'new'>(null)
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const reload = async () => setDrafts(await getDraftMeals())

  useEffect(() => {
    setMounted(true)
    void reload()
  }, [])

  const handleSave = async (draft: DraftMeal) => {
    await saveDraftMeal(draft)
    await reload()
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    await deleteDraftMeal(id)
    await reload()
    setConfirmDelete(null)
  }

  const handleToggleFavorite = async (draft: DraftMeal) => {
    await saveDraftMeal({ ...draft, favorite: !draft.favorite })
    await reload()
  }

  if (!mounted) return null

  if (editing) {
    return (
      <div className="px-4 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white text-sm">← Back</button>
          <h1 className="text-xl font-bold">{editing === 'new' ? 'New Draft Meal' : 'Edit Draft Meal'}</h1>
        </div>
        <DraftForm
          initial={editing === 'new' ? undefined : editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      </div>
    )
  }

  const filteredDrafts = drafts.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.tags.some((t) => t.includes(search.toLowerCase())) ||
      d.meal_type.includes(search.toLowerCase()),
  )

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Draft Meals</h1>
          <p className="text-slate-400 text-sm">{drafts.length} saved meals</p>
        </div>
        <button onClick={() => setEditing('new')} className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">+ New</button>
      </div>

      <input type="search" placeholder="Search meals, types, tags..." value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" />

      {filteredDrafts.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-slate-500 text-sm">{search ? 'No matches found.' : 'No draft meals yet.'}</p>
          {!search && (
            <button onClick={() => setEditing('new')} className="text-emerald-400 text-sm hover:underline">Create your first draft meal</button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDrafts.map((draft) => (
            <div key={draft.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{MEAL_TYPE_ICONS[draft.meal_type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{draft.name}</p>
                    {draft.favorite && <span className="text-amber-400 text-xs">★</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{draft.ingredient_list}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm">{draft.estimated_calories}</p>
                  <p className="text-xs text-slate-500">cal</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div><p className="text-slate-500">Protein</p><p className="font-medium">{draft.estimated_protein}g</p></div>
                <div><p className="text-slate-500">Carbs</p><p className="font-medium">{draft.estimated_carbs}g</p></div>
                <div><p className="text-slate-500">Fat</p><p className="font-medium">{draft.estimated_fat}g</p></div>
              </div>

              {draft.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {draft.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-1 border-t border-slate-800">
                <button onClick={() => void handleToggleFavorite(draft)}
                  className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${draft.favorite ? 'text-amber-400 bg-amber-900/20 hover:bg-amber-900/30' : 'text-slate-500 hover:text-slate-300 bg-slate-800 hover:bg-slate-700'}`}>
                  {draft.favorite ? '★ Favorited' : '☆ Favorite'}
                </button>
                <button onClick={() => setEditing(draft)} className="flex-1 text-xs py-1.5 rounded-lg text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors">Edit</button>
                <button
                  onClick={async () => {
                    const dup: DraftMeal = { ...draft, id: generateId(), name: draft.name + ' (copy)', favorite: false, created_at: new Date().toISOString() }
                    await saveDraftMeal(dup)
                    await reload()
                  }}
                  className="flex-1 text-xs py-1.5 rounded-lg text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors">
                  Duplicate
                </button>
                <button onClick={() => setConfirmDelete(draft.id)} className="flex-1 text-xs py-1.5 rounded-lg text-red-500 bg-slate-800 hover:bg-red-900/20 transition-colors">Delete</button>
              </div>

              {confirmDelete === draft.id && (
                <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-red-300">Delete &ldquo;{draft.name}&rdquo;?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDelete(null)} className="text-xs text-slate-400 hover:text-white">Cancel</button>
                    <button onClick={() => void handleDelete(draft.id)} className="text-xs text-red-400 hover:text-red-300 font-medium">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
