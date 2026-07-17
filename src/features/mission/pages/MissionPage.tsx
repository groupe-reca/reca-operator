import { useState } from 'react'
import { Loader2, TriangleAlert } from 'lucide-react'
import { MissionHeader } from '../components/MissionHeader'
import { MissionCard } from '../components/MissionCard'
import { StopListHeader } from '../components/StopListHeader'
import { StopList } from '../components/StopList'
import { MissionFooter } from '../components/MissionFooter'
import { useMissionEngine } from '../hooks/useMissionEngine'
import type { SecondarySort } from '../hooks/useMissionEngine'

export function MissionPage() {
  const [sort, setSort] = useState<SecondarySort>('ordre')
  const engine = useMissionEngine(sort)

  const toggleSort = () => setSort((prev) => (prev === 'ordre' ? 'distance' : 'ordre'))

  return (
    <div className="flex h-[100svh] flex-col bg-surface-bg">
      {/* En-tête fixe */}
      <header className="shrink-0 px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-2">
        <MissionHeader
          position={engine.position}
          now={engine.now}
          phase={engine.phase}
          onPlay={engine.play}
          onPause={engine.pause}
          onStop={engine.stop}
        />
        {engine.gpsError && engine.phase === 'RUNNING' && (
          <p className="mt-2 flex items-center gap-1.5 px-1 text-label text-status-warning">
            <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
            {engine.gpsError}
          </p>
        )}
      </header>

      {/* Contenu défilable */}
      <main className="flex-1 overflow-y-auto px-3 pb-3">
        {engine.isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-text-muted" aria-hidden="true" />
          </div>
        ) : engine.error ? (
          <p className="mt-6 flex items-center justify-center gap-2 text-body text-status-danger">
            <TriangleAlert className="size-4" aria-hidden="true" />
            Impossible de charger la tournée.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {engine.mission && (
              <MissionCard
                nom={engine.mission.nom}
                completedCount={engine.completedCount}
                totalCount={engine.totalCount}
              />
            )}
            <StopListHeader sort={sort} onToggleSort={toggleSort} />
            <StopList stops={engine.stops} phase={engine.phase} />
          </div>
        )}
      </main>

      {/* Barre inférieure fixe */}
      <footer className="shrink-0">
        <MissionFooter
          nextStop={engine.nextStop}
          completedCount={engine.completedCount}
          totalCount={engine.totalCount}
          elapsedMs={engine.elapsedMs}
        />
      </footer>
    </div>
  )
}
