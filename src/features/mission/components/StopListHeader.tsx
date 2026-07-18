import { RefreshCw } from 'lucide-react'

/**
 * En-tête de la liste des autres résidences. Le tri est **toujours** par distance
 * réelle (l'app s'adapte au parcours de l'opérateur) : plus de bascule d'ordre,
 * juste un rappel « Triées par proximité ».
 */
export function StopListHeader() {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="text-label font-semibold uppercase tracking-wide text-text-muted">
        Autres résidences
      </h2>
      <span className="flex items-center gap-1.5 text-label text-text-muted">
        Triées par proximité
        <RefreshCw className="size-3.5" aria-hidden="true" />
      </span>
    </div>
  )
}
