import { ListOrdered } from 'lucide-react'

/**
 * En-tête de la liste des autres résidences. Le tri suit **l'ordre de la
 * mission** (pas la distance GPS, cf. décision client du 2026-07-25) : pas de
 * bascule, juste un rappel.
 */
export function StopListHeader() {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="text-label font-semibold uppercase tracking-wide text-text-muted">
        Autres résidences
      </h2>
      <span className="flex items-center gap-1.5 text-label text-text-muted">
        Ordre de la mission
        <ListOrdered className="size-3.5" aria-hidden="true" />
      </span>
    </div>
  )
}
