import { STATUS_CONFIG } from '../domain/status'
import { formatStopwatch } from '../domain/format'
import { TONE_CLASSES } from './statusTone'
import type { CounterView } from '../engine/MissionEngine'

type SmartCounterProps = {
  counter: CounterView
  /** `hero` = gros chiffre plein écran ; `pill` = pastille compacte (en-tête
   * historique) ; `floating` = gros compteur flottant par-dessus la carte. */
  variant?: 'hero' | 'pill' | 'floating'
}

/**
 * Compteur intelligent : temps (MM:SS), icône + libellé de l'état courant, et la
 * cible du compte à rebours quand il y en a une. Change automatiquement selon
 * l'état. Les variants restylent le même contenu sans dupliquer la logique
 * d'affichage.
 */
export function SmartCounter({ counter, variant = 'hero' }: SmartCounterProps) {
  const descriptor = STATUS_CONFIG[counter.status]
  const tone = TONE_CLASSES[descriptor.tone]
  const Icon = descriptor.icon

  if (variant === 'pill') {
    return (
      <div className="flex flex-col items-end gap-1">
        <span
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${tone.pill} ${tone.pillIcon}`}
        >
          <Icon className="size-3.5" aria-hidden="true" />
          {descriptor.label}
        </span>
        <span className={`text-label font-semibold tabular-nums ${tone.text}`}>
          {formatStopwatch(counter.elapsedMs)}
        </span>
      </div>
    )
  }

  if (variant === 'floating') {
    return (
      <div
        className={`flex flex-col items-end rounded-card border border-white/10 bg-surface-card/70 px-4 py-2 shadow-lg shadow-black/40 backdrop-blur-md ${tone.text}`}
      >
        <p className="text-[32px] font-extrabold leading-none tabular-nums">
          {formatStopwatch(counter.elapsedMs)}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <Icon className="size-3.5" aria-hidden="true" />
          <span className="text-[11px] font-bold uppercase tracking-wide">{descriptor.label}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end">
      <p className={`text-h1 font-bold leading-none tabular-nums ${tone.text}`}>
        {formatStopwatch(counter.elapsedMs)}
      </p>
      <div className={`mt-1 flex items-center gap-1.5 ${tone.text}`}>
        <Icon className="size-4" aria-hidden="true" />
        <span className="text-label font-semibold uppercase tracking-wide">
          {descriptor.label}
        </span>
      </div>
      {counter.targetMs !== null && (
        <p className="mt-0.5 text-label tabular-nums text-text-muted">
          max {formatStopwatch(counter.targetMs)}
        </p>
      )}
    </div>
  )
}
