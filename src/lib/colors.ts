import type { Theme } from '../themeStore'

const THEME_BASE_HEX: Record<Theme, string> = {
  pink: '#b8677a',
  blue: '#5c7c96',
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.round(Math.max(0, Math.min(255, v)))
  return '#' + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')
}

function mix(hex: string, target: [number, number, number], amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r + (target[0] - r) * amount, g + (target[1] - g) * amount, b + (target[2] - b) * amount)
}

const WHITE: [number, number, number] = [255, 255, 255]
const BLACK: [number, number, number] = [0, 0, 0]

/** A range of tints/shades of a single base color, from light to dark. */
function generateShades(baseHex: string): string[] {
  return [
    mix(baseHex, WHITE, 0.72),
    mix(baseHex, WHITE, 0.5),
    mix(baseHex, WHITE, 0.28),
    mix(baseHex, WHITE, 0.1),
    baseHex,
    mix(baseHex, BLACK, 0.18),
    mix(baseHex, BLACK, 0.34),
    mix(baseHex, BLACK, 0.5),
  ]
}

/** Category color choices are shades of the active theme's accent color,
 * not an arbitrary rainbow — keeps custom categories visually consistent
 * with the rest of the app. */
export function categoryColorChoicesForTheme(theme: Theme): string[] {
  return generateShades(THEME_BASE_HEX[theme])
}

const PALETTE_HUES = [
  '#ef4444', // rouge
  '#f97316', // orange
  '#f59e0b', // ambre
  '#eab308', // jaune
  '#84cc16', // citron vert
  '#22c55e', // vert
  '#14b8a6', // sarcelle
  '#06b6d4', // cyan
  '#3b82f6', // bleu
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // pourpre
  '#d946ef', // fuchsia
  '#ec4899', // rose vif
  '#f43f5e', // rose rouge
  '#64748b', // gris ardoise
]

function shadesForHue(baseHex: string): string[] {
  return [mix(baseHex, WHITE, 0.55), mix(baseHex, WHITE, 0.22), baseHex, mix(baseHex, BLACK, 0.3)]
}

/** A wide multi-hue palette (each hue with a light/base/dark range), for
 * picking a category color freely when adding or editing a task. */
export function categoryColorPalette(): string[] {
  return PALETTE_HUES.flatMap(shadesForHue)
}
