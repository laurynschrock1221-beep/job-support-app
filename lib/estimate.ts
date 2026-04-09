// Pragmatic macro estimator — household-unit assumptions, not nutrition-label precision.

interface FoodEntry {
  cal: number
  protein: number
  carbs: number
  fat: number
  unit: string // what "1 unit" means for this food
}

// Per-unit nutritional estimates
const FOOD_DB: Record<string, FoodEntry> = {
  // Proteins
  'chicken breast': { cal: 35, protein: 7, carbs: 0, fat: 0.5, unit: 'oz' },
  'chicken thigh': { cal: 50, protein: 6.5, carbs: 0, fat: 3, unit: 'oz' },
  chicken: { cal: 35, protein: 7, carbs: 0, fat: 0.5, unit: 'oz' },
  turkey: { cal: 35, protein: 7, carbs: 0, fat: 1, unit: 'oz' },
  'ground beef': { cal: 75, protein: 7, carbs: 0, fat: 5, unit: 'oz' },
  beef: { cal: 65, protein: 7, carbs: 0, fat: 4, unit: 'oz' },
  salmon: { cal: 40, protein: 7, carbs: 0, fat: 2, unit: 'oz' },
  tuna: { cal: 25, protein: 6, carbs: 0, fat: 0.3, unit: 'oz' },
  shrimp: { cal: 28, protein: 6, carbs: 0, fat: 0.3, unit: 'oz' },
  egg: { cal: 70, protein: 6, carbs: 0.5, fat: 5, unit: 'each' },
  eggs: { cal: 70, protein: 6, carbs: 0.5, fat: 5, unit: 'each' },
  'egg white': { cal: 17, protein: 3.6, carbs: 0.2, fat: 0, unit: 'each' },
  'egg whites': { cal: 17, protein: 3.6, carbs: 0.2, fat: 0, unit: 'each' },
  chorizo: { cal: 130, protein: 7, carbs: 1, fat: 11, unit: 'oz' },
  bacon: { cal: 45, protein: 3, carbs: 0, fat: 3.5, unit: 'strip' },
  'cottage cheese': { cal: 110, protein: 14, carbs: 6, fat: 2.5, unit: 'cup' },
  'greek yogurt': { cal: 130, protein: 17, carbs: 9, fat: 3, unit: 'cup' },
  'whey protein': { cal: 120, protein: 25, carbs: 3, fat: 1, unit: 'scoop' },
  'protein powder': { cal: 120, protein: 25, carbs: 3, fat: 1, unit: 'scoop' },
  'protein shake': { cal: 150, protein: 28, carbs: 6, fat: 2, unit: 'each' },

  // Carbs / Grains
  tortilla: { cal: 90, protein: 2, carbs: 18, fat: 2, unit: 'each' },
  'corn tortilla': { cal: 60, protein: 1.5, carbs: 12, fat: 1, unit: 'each' },
  'flour tortilla': { cal: 90, protein: 2.5, carbs: 18, fat: 2, unit: 'each' },
  rice: { cal: 200, protein: 4, carbs: 44, fat: 0.5, unit: 'cup' },
  'white rice': { cal: 200, protein: 4, carbs: 44, fat: 0.5, unit: 'cup' },
  'brown rice': { cal: 215, protein: 5, carbs: 45, fat: 2, unit: 'cup' },
  'rice cake': { cal: 35, protein: 1, carbs: 7, fat: 0.3, unit: 'each' },
  'rice cakes': { cal: 35, protein: 1, carbs: 7, fat: 0.3, unit: 'each' },
  bread: { cal: 80, protein: 3, carbs: 15, fat: 1, unit: 'slice' },
  pasta: { cal: 220, protein: 8, carbs: 43, fat: 1.5, unit: 'cup' },
  oatmeal: { cal: 150, protein: 5, carbs: 27, fat: 3, unit: 'cup' },
  oats: { cal: 150, protein: 5, carbs: 27, fat: 3, unit: 'cup' },
  chips: { cal: 140, protein: 2, carbs: 18, fat: 7, unit: 'oz' },
  'tortilla chips': { cal: 140, protein: 2, carbs: 18, fat: 7, unit: 'oz' },
  fries: { cal: 370, protein: 4, carbs: 48, fat: 18, unit: 'serving' },
  gushers: { cal: 90, protein: 0, carbs: 22, fat: 1, unit: 'pouch' },
  crackers: { cal: 130, protein: 3, carbs: 22, fat: 4, unit: 'oz' },

  // Dairy / Fats
  cheese: { cal: 110, protein: 7, carbs: 0.5, fat: 9, unit: 'oz' },
  'cheddar cheese': { cal: 110, protein: 7, carbs: 0.5, fat: 9, unit: 'oz' },
  'mozzarella': { cal: 85, protein: 6, carbs: 1, fat: 6, unit: 'oz' },
  queso: { cal: 80, protein: 3, carbs: 4, fat: 6, unit: 'tbsp' },
  'sour cream': { cal: 60, protein: 1, carbs: 2, fat: 5, unit: 'tbsp' },
  'cream cheese': { cal: 100, protein: 2, carbs: 1, fat: 10, unit: 'tbsp' },
  butter: { cal: 100, protein: 0, carbs: 0, fat: 11, unit: 'tbsp' },
  'olive oil': { cal: 120, protein: 0, carbs: 0, fat: 14, unit: 'tbsp' },
  avocado: { cal: 240, protein: 3, carbs: 13, fat: 22, unit: 'each' },
  'almond milk': { cal: 30, protein: 1, carbs: 1, fat: 2.5, unit: 'cup' },
  milk: { cal: 150, protein: 8, carbs: 12, fat: 8, unit: 'cup' },

  // Vegetables
  broccoli: { cal: 30, protein: 3, carbs: 6, fat: 0, unit: 'cup' },
  spinach: { cal: 7, protein: 1, carbs: 1, fat: 0, unit: 'cup' },
  'mixed veggies': { cal: 50, protein: 2, carbs: 10, fat: 0, unit: 'cup' },
  salsa: { cal: 10, protein: 0.5, carbs: 2, fat: 0, unit: 'tbsp' },
  lettuce: { cal: 5, protein: 0.5, carbs: 1, fat: 0, unit: 'cup' },
  tomato: { cal: 22, protein: 1, carbs: 5, fat: 0, unit: 'each' },

  // Fruit
  apple: { cal: 95, protein: 0.5, carbs: 25, fat: 0.3, unit: 'each' },
  banana: { cal: 105, protein: 1.3, carbs: 27, fat: 0.3, unit: 'each' },
  berries: { cal: 50, protein: 1, carbs: 12, fat: 0.5, unit: 'cup' },

  // Condiments / Misc
  mustard: { cal: 5, protein: 0.3, carbs: 0.5, fat: 0, unit: 'tbsp' },
  ketchup: { cal: 20, protein: 0.3, carbs: 5, fat: 0, unit: 'tbsp' },
  mayo: { cal: 90, protein: 0, carbs: 0, fat: 10, unit: 'tbsp' },
  ranch: { cal: 70, protein: 0.5, carbs: 1, fat: 7, unit: 'tbsp' },
  hummus: { cal: 50, protein: 2, carbs: 5, fat: 3, unit: 'tbsp' },
  'peanut butter': { cal: 95, protein: 4, carbs: 3, fat: 8, unit: 'tbsp' },
  'almond butter': { cal: 98, protein: 3.5, carbs: 3, fat: 9, unit: 'tbsp' },
}

// Vague quantity approximations
const VAGUE_QUANTITIES: Record<string, number> = {
  some: 1,
  handful: 1,
  few: 2,
  couple: 2,
  little: 0.5,
  bit: 0.5,
  tiny: 0.25,
  large: 1.5,
  big: 1.5,
  small: 0.75,
  'a lot': 2,
}

// Unit conversions to standard unit
const UNIT_ALIASES: Record<string, string> = {
  oz: 'oz',
  ounce: 'oz',
  ounces: 'oz',
  cup: 'cup',
  cups: 'cup',
  tbsp: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  slice: 'each',
  slices: 'each',
  piece: 'each',
  pieces: 'each',
  scoop: 'each',
  scoops: 'each',
  strip: 'each',
  strips: 'each',
  pouch: 'each',
  pouches: 'each',
  serving: 'each',
  servings: 'each',
  can: 'can',
  cans: 'can',
}

// Scale factor when the logged unit differs from the DB unit
function getUnitScalar(loggedUnit: string, dbUnit: string, qty: number): number {
  const lu = UNIT_ALIASES[loggedUnit] ?? loggedUnit
  const du = dbUnit

  if (lu === du || lu === 'each') return qty
  // tbsp → cup (16 tbsp = 1 cup)
  if (lu === 'tbsp' && du === 'cup') return qty / 16
  // cup → tbsp
  if (lu === 'cup' && du === 'tbsp') return qty * 16
  // tsp → tbsp (3 tsp = 1 tbsp)
  if (lu === 'tsp' && du === 'tbsp') return qty / 3
  // can of tuna ≈ 5 oz
  if (lu === 'can' && du === 'oz') return qty * 5
  return qty
}

export interface MacroEstimate {
  calories: number
  protein: number
  carbs: number
  fat: number
  confidence: 'high' | 'medium' | 'low'
  parsed_items: string[]
}

export function estimateMacros(text: string): MacroEstimate {
  const result: MacroEstimate = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    confidence: 'high',
    parsed_items: [],
  }

  // Split on commas, "and", newlines, semicolons
  const segments = text
    .toLowerCase()
    .split(/,|;|\band\b|\n/)
    .map((s) => s.trim())
    .filter(Boolean)

  let unparsed = 0

  for (const seg of segments) {
    const match = parseSegment(seg)
    if (match) {
      result.calories += match.calories
      result.protein += match.protein
      result.carbs += match.carbs
      result.fat += match.fat
      result.parsed_items.push(match.label)
    } else {
      unparsed++
    }
  }

  if (unparsed > 0 && result.parsed_items.length === 0) {
    result.confidence = 'low'
  } else if (unparsed > 0) {
    result.confidence = 'medium'
  }

  // Round
  result.calories = Math.round(result.calories)
  result.protein = Math.round(result.protein)
  result.carbs = Math.round(result.carbs)
  result.fat = Math.round(result.fat)

  return result
}

interface ParsedItem {
  calories: number
  protein: number
  carbs: number
  fat: number
  label: string
}

function parseSegment(seg: string): ParsedItem | null {
  // Try to find a food match in the DB
  const food = findFood(seg)
  if (!food) return null

  const qty = extractQuantity(seg, food.key)
  const scalar = getUnitScalar(qty.unit, food.entry.unit, qty.amount)

  return {
    calories: food.entry.cal * scalar,
    protein: food.entry.protein * scalar,
    carbs: food.entry.carbs * scalar,
    fat: food.entry.fat * scalar,
    label: `${qty.amount > 0 ? qty.amount : 1}${qty.unit ? ' ' + qty.unit : ''} ${food.key}`,
  }
}

function findFood(seg: string): { key: string; entry: FoodEntry } | null {
  // Longest match first to prefer "chicken breast" over "chicken"
  const keys = Object.keys(FOOD_DB).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (seg.includes(key)) {
      return { key, entry: FOOD_DB[key] }
    }
  }
  return null
}

interface Qty {
  amount: number
  unit: string
}

function extractQuantity(seg: string, foodKey: string): Qty {
  // Fraction like "1/2"
  const fracRe = /(\d+)\s*\/\s*(\d+)/
  const numRe = /(\d+\.?\d*)/
  const unitRe = new RegExp(
    `(${Object.keys(UNIT_ALIASES).join('|')})`,
    'i',
  )
  const vagueRe = new RegExp(`(${Object.keys(VAGUE_QUANTITIES).join('|')})`, 'i')

  let amount = 1
  let unit = ''

  const fracMatch = seg.match(fracRe)
  if (fracMatch) {
    amount = parseInt(fracMatch[1]) / parseInt(fracMatch[2])
  } else {
    const numMatch = seg.match(numRe)
    if (numMatch) amount = parseFloat(numMatch[1])
  }

  const unitMatch = seg.match(unitRe)
  if (unitMatch) unit = unitMatch[1].toLowerCase()

  // Check for vague quantity words before the food key
  const beforeFood = seg.split(foodKey)[0] ?? ''
  const vagueMatch = beforeFood.match(vagueRe)
  if (vagueMatch && !fracMatch && !seg.match(numRe)) {
    amount = VAGUE_QUANTITIES[vagueMatch[1].toLowerCase()] ?? 1
  }

  return { amount, unit }
}

// ── Quick format ──────────────────────────────────────────────────────────────

export function confidenceLabel(c: MacroEstimate['confidence']): string {
  return { high: 'Confident', medium: 'Estimated', low: 'Rough guess' }[c]
}
