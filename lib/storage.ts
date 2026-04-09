import { supabase } from './supabase'
import type {
  DailyLog,
  DraftMeal,
  LoggedMeal,
  ActivityLog,
  HydrationLog,
  UserSettings,
} from './types'

// ── Defaults ──────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: UserSettings = {
  calorie_target_min: 1400,
  calorie_target_max: 1600,
  protein_target_min: 120,
  protein_target_max: 140,
  hydration_target_oz: 80,
  step_goal: 8000,
}

// ── Daily Logs ────────────────────────────────────────────────────────────────

export async function getDailyLogs(): Promise<DailyLog[]> {
  const { data } = await supabase.from('daily_logs').select('*').order('date')
  return (data ?? []) as DailyLog[]
}

export async function getDailyLog(date: string): Promise<DailyLog | null> {
  const { data } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('date', date)
    .maybeSingle()
  return data as DailyLog | null
}

export async function saveDailyLog(log: DailyLog): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('daily_logs')
    .upsert({ ...log, user_id: user.id })
}

// ── Draft Meals ───────────────────────────────────────────────────────────────

export async function getDraftMeals(): Promise<DraftMeal[]> {
  const { data } = await supabase
    .from('draft_meals')
    .select('*')
    .order('favorite', { ascending: false })
  return (data ?? []) as DraftMeal[]
}

export async function getDraftMeal(id: string): Promise<DraftMeal | null> {
  const { data } = await supabase
    .from('draft_meals')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return data as DraftMeal | null
}

export async function saveDraftMeal(meal: DraftMeal): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('draft_meals').upsert({ ...meal, user_id: user.id })
}

export async function deleteDraftMeal(id: string): Promise<void> {
  await supabase.from('draft_meals').delete().eq('id', id)
}

// ── Logged Meals ──────────────────────────────────────────────────────────────

export async function getLoggedMeals(date?: string): Promise<LoggedMeal[]> {
  let query = supabase.from('logged_meals').select('*').order('time')
  if (date) query = query.eq('date', date)
  const { data } = await query
  return (data ?? []) as LoggedMeal[]
}

export async function saveLoggedMeal(meal: LoggedMeal): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('logged_meals').upsert({ ...meal, user_id: user.id })
}

export async function deleteLoggedMeal(id: string): Promise<void> {
  await supabase.from('logged_meals').delete().eq('id', id)
}

// ── Activity Logs ─────────────────────────────────────────────────────────────

export async function getActivityLogs(date?: string): Promise<ActivityLog[]> {
  let query = supabase.from('activity_logs').select('*').order('id')
  if (date) query = query.eq('date', date)
  const { data } = await query
  return (data ?? []) as ActivityLog[]
}

export async function saveActivityLog(log: ActivityLog): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('activity_logs').upsert({ ...log, user_id: user.id })
}

export async function deleteActivityLog(id: string): Promise<void> {
  await supabase.from('activity_logs').delete().eq('id', id)
}

// ── Hydration Logs ────────────────────────────────────────────────────────────

export async function getHydrationLogs(date?: string): Promise<HydrationLog[]> {
  let query = supabase.from('hydration_logs').select('*').order('time')
  if (date) query = query.eq('date', date)
  const { data } = await query
  return (data ?? []) as HydrationLog[]
}

export async function saveHydrationLog(log: HydrationLog): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('hydration_logs').upsert({ ...log, user_id: user.id })
}

export async function deleteHydrationLog(id: string): Promise<void> {
  await supabase.from('hydration_logs').delete().eq('id', id)
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<UserSettings> {
  const { data } = await supabase.from('user_settings').select('*').maybeSingle()
  if (!data) return { ...DEFAULT_SETTINGS }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user_id, ...settings } = data as UserSettings & { user_id: string }
  return settings
}

export async function saveSettings(s: UserSettings): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('user_settings')
    .upsert({ ...s, user_id: user.id }, { onConflict: 'user_id' })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function todayDate(): string {
  return new Date().toISOString().split('T')[0]
}

// ── Seed Data ─────────────────────────────────────────────────────────────────

const SEED_DRAFTS: Omit<DraftMeal, 'id' | 'created_at'>[] = [
  {
    name: 'Breakfast Taco',
    meal_type: 'breakfast',
    ingredient_list: '2 scrambled eggs, 1 small flour tortilla, 1 oz chorizo crumbles, salsa',
    default_portions: '2 tacos',
    estimated_calories: 320,
    estimated_protein: 22,
    estimated_carbs: 24,
    estimated_fat: 14,
    tags: ['breakfast', 'high-protein'],
    notes: '',
    favorite: true,
  },
  {
    name: 'Protein Shake',
    meal_type: 'snack',
    ingredient_list: '1.5 scoops whey protein, 1 cup unsweetened almond milk',
    default_portions: '1 shake',
    estimated_calories: 190,
    estimated_protein: 38,
    estimated_carbs: 5,
    estimated_fat: 3,
    tags: ['snack', 'high-protein', 'training-day'],
    notes: '',
    favorite: true,
  },
  {
    name: 'Tuna Rice Cake Lunch',
    meal_type: 'lunch',
    ingredient_list: '1 can tuna (5 oz), 4 rice cakes, mustard, pickles',
    default_portions: '1 serving',
    estimated_calories: 260,
    estimated_protein: 38,
    estimated_carbs: 20,
    estimated_fat: 2,
    tags: ['lunch', 'high-protein', 'low-fat'],
    notes: '',
    favorite: true,
  },
  {
    name: 'Cottage Cheese Bowl',
    meal_type: 'snack',
    ingredient_list: '1 cup low-fat cottage cheese, 1/2 cup mixed berries',
    default_portions: '1 bowl',
    estimated_calories: 180,
    estimated_protein: 24,
    estimated_carbs: 16,
    estimated_fat: 3,
    tags: ['snack', 'high-protein', 'rest-day'],
    notes: '',
    favorite: false,
  },
  {
    name: 'Salmon Bowl',
    meal_type: 'dinner',
    ingredient_list: '5 oz salmon, 3/4 cup cooked rice, roasted broccoli, lemon',
    default_portions: '1 bowl',
    estimated_calories: 480,
    estimated_protein: 42,
    estimated_carbs: 42,
    estimated_fat: 12,
    tags: ['dinner', 'high-protein', 'training-day'],
    notes: '',
    favorite: false,
  },
  {
    name: 'Chicken & Rice',
    meal_type: 'dinner',
    ingredient_list: '5 oz grilled chicken breast, 3/4 cup cooked white rice, steamed broccoli',
    default_portions: '1 plate',
    estimated_calories: 430,
    estimated_protein: 48,
    estimated_carbs: 40,
    estimated_fat: 5,
    tags: ['dinner', 'high-protein', 'lean'],
    notes: '',
    favorite: false,
  },
]

export async function seedDraftMealsIfEmpty(): Promise<void> {
  const existing = await getDraftMeals()
  if (existing.length > 0) return
  const now = new Date().toISOString()
  for (const draft of SEED_DRAFTS) {
    await saveDraftMeal({ ...draft, id: generateId(), created_at: now })
  }
}
