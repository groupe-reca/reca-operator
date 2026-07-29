import { ArrowRight, Car, Navigation, TriangleAlert } from 'lucide-react'
import { STATUS_CONFIG } from '../domain/status'
import { formatDistance, formatEta, splitAddress } from '../domain/format'
import { TONE_CLASSES } from './statusTone'
import type { ActiveMissionView } from '../engine/MissionEngine'

/**
 * Carte « Prochaine résidence » : le stop actif, détecté automatiquement.
 * Purement présentationnelle — elle reçoit la vue déjà calculée par le moteur.
 * Quand une consigne ATTENTION existe (message opérateur du contrat), elle
 * s'affiche à côté (deux colonnes) plutôt qu'en dessous ; sinon la carte reste
 * pleine largeur.
 */
export function CurrentMissionCard({ mission }: { mission: ActiveMissionView }) {
  const { stop, nextStatus, attention } = mission
  const { street, city } = splitAddress(stop.adresse)
  const descriptor = STATUS_CONFIG[stop.status]
  const tone = TONE_CLASSES[descriptor.tone]
  const StateIcon = descriptor.icon
  const nextDescriptor = nextStatus ? STATUS_CONFIG[nextStatus] : null
  const hasAttention = attention.length > 0

  return (
    <section className="rounded-card border-l-4 border border-accent-border bg-surface-card/75 p-4 shadow-lg shadow-black/40 backdrop-blur-md">
      <span className="mx-auto mb-2 block h-1 w-9 rounded-full bg-text-faint/50" aria-hidden="true" />

      <p className="text-label font-semibold uppercase tracking-wide text-accent-strong">
        Prochaine résidence
      </p>

      <div className="mt-2 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-section font-bold leading-tight text-text">{street}</h1>
              {city && <p className="truncate text-body text-text-muted">{city}</p>}
            </div>

            <a
              href={`https://maps.google.com/?q=${stop.lat},${stop.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 flex-col items-center gap-1 text-accent-strong focus-visible:outline-none"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-accent text-white">
                <Navigation className="size-5" aria-hidden="true" fill="currentColor" strokeWidth={0} />
              </span>
              <span className="text-[11px] font-medium text-text-muted">Itinéraire</span>
            </a>
          </div>

          <div className="mt-3 flex items-center gap-4 text-body">
            <span className="flex items-center gap-1.5 text-text-muted">
              <Car className="size-4" aria-hidden="true" />
              <span className="tabular-nums">{formatEta(stop.etaMinutes)}</span>
            </span>
            <span className="text-text-faint">•</span>
            <span className="tabular-nums text-text-muted">{formatDistance(stop.distanceMeters)}</span>
          </div>

          <div className="mt-3 flex items-center gap-2 text-label font-semibold uppercase tracking-wide">
            <span className={`flex items-center gap-1.5 ${tone.text}`}>
              <StateIcon className="size-4" aria-hidden="true" />
              {descriptor.label}
            </span>
            {nextDescriptor && (
              <>
                <ArrowRight className="size-3.5 text-text-faint" aria-hidden="true" />
                <span className="text-text-muted">{nextDescriptor.label}</span>
              </>
            )}
          </div>
        </div>

        {hasAttention && (
          <div className="w-[38%] shrink-0 rounded-card border border-status-warning/30 bg-status-warning/10 p-2.5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-status-warning">
              <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
              Attention
            </p>
            <ul className="mt-1.5 space-y-1">
              {attention.map((note, i) => (
                <li key={i} className="text-[11px] leading-snug text-text">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
