import logo from '@/assets/logo-sombre.svg'
import { SmartCounter } from './SmartCounter'
import type { CounterView } from '../engine/MissionEngine'

type MissionHeaderBarProps = {
  missionLabel: string | null
  routeName: string | null
  operatorName: string | null
  equipmentName: string | null
  counter: CounterView
}

/**
 * En-tête fixe : logo + Mission/Route à gauche, opérateur/équipement + pastille
 * de statut à droite. Deux lignes (plutôt que 4 colonnes sur une seule) pour
 * rester lisible sur un écran de téléphone étroit.
 */
export function MissionHeaderBar({
  missionLabel,
  routeName,
  operatorName,
  equipmentName,
  counter,
}: MissionHeaderBarProps) {
  return (
    <header className="flex shrink-0 flex-col gap-1.5 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-2">
      <div className="flex items-center justify-between gap-3">
        <img src={logo} alt="Groupe RECA" className="h-5 w-auto shrink-0 object-contain" />
        <SmartCounter counter={counter} variant="pill" />
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {missionLabel && <p className="truncate text-body font-bold text-text">{missionLabel}</p>}
          {routeName && (
            <p className="truncate text-label font-medium text-accent-strong">{routeName}</p>
          )}
        </div>
        {(operatorName || equipmentName) && (
          <div className="min-w-0 shrink-0 text-right">
            {operatorName && <p className="truncate text-label font-semibold text-text">{operatorName}</p>}
            {equipmentName && <p className="truncate text-[11px] text-text-muted">{equipmentName}</p>}
          </div>
        )}
      </div>
    </header>
  )
}
