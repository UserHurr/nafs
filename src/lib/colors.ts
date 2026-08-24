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
