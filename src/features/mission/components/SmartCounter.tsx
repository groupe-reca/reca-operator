import { STATUS_CONFIG } from '../domain/status'
import { formatStopwatch } from '../domain/format'
import { TONE_CLASSES } from './statusTone'
import type { CounterView } from '../engine/MissionEngine'

/**
 * Compteur intelligent — coin supérieur droit, **sans cadre**. Affiche
 * uniquement : temps (MM:SS), icône + libellé de l'état courant, et la cible du
 * compte à rebours quand il y en a une. Change automatiquement selon l'état.
 */
export function SmartCounter({ counter }: { counter: CounterView }) {
  const descriptor = STATUS_CONFIG[counter.status]
  const tone = TONE_CLASSES[descriptor.tone]
  const Icon = descriptor.icon

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
