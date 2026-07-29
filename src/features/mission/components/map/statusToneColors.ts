import type { StatusTone } from '../../domain/status'

/**
 * Équivalent hex du `tone` abstrait, pour les marqueurs Mapbox (qui ont besoin de
 * couleurs directes, pas de classes Tailwind). Mêmes valeurs que les tokens
 * `--color-status-*`/`--color-accent*` de `src/styles/index.css` — ne jamais
 * diverger de cette palette.
 */
export const TONE_HEX: Record<StatusTone, string> = {
  neutral: '#64748b',
  accent: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
}
