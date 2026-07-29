import { useState } from 'react'
import { Loader2, RefreshCw, TriangleAlert, WifiOff } from 'lucide-react'
import { MissionHeaderBar } from '../components/MissionHeaderBar'
import { MissionMap } from '../components/map/MissionMap'
import { CurrentMissionCard } from '../components/CurrentMissionCard'
import { MissionCountersRow } from '../components/MissionCountersRow'
import { StopListHeader } from '../components/StopListHeader'
import { StopList } from '../components/StopList'
import { MissionFooter } from '../components/MissionFooter'
import { ProblemModal } from '../components/ProblemModal'
import { MissionOptionsSheet } from '../components/MissionOptionsSheet'
import { Button } from '@/components/ui/Button'
import { useMissionEngine } from '../hooks/useMissionEngine'
import { useVoiceBridge } from '../hooks/useVoiceBridge'
import { useMissionSync } from '../hooks/useMissionSync'
import type { ProblemCode } from '../domain/problemCodes'

export function MissionPage() {
  const engine = useMissionEngine()
  const { snapshot } = engine
  const [problemOpen, setProblemOpen] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)

  const running = snapshot.phase === 'RUNNING'

  // Couche voix (glue) : route les événements du moteur vers le manager d'annonces.
  const voice = useVoiceBridge({
    subscribeEvents: engine.subscribeEvents,
    config: snapshot.config,
  })

  // Synchro Supabase (glue) : persiste chaque changement de statut terminal + démarre la Mission.
  const sync = useMissionSync({ subscribeEvents: engine.subscribeEvents, missionId: engine.missionId })

  const handleSelectProblem = (code: ProblemCode) => {
    engine.reportProblem(code)
    setProblemOpen(false)
  }

  // Aucune mission assignée : écran dédié, aucune autre interface.
  if (engine.noMission) {
    return <NoMissionScreen onRefresh={engine.refetchMission} isRefreshing={engine.isFetchingMission} />
  }

  const reportedCount = snapshot.allStops.filter((s) => s.status === 'NON_TERMINE').length
  const todoCount = Math.max(0, snapshot.totalCount - snapshot.completedCount - reportedCount)

  return (
    <div className="flex h-[100svh] flex-col bg-surface-bg">
      <MissionHeaderBar
        missionLabel={engine.missionLabel}
        routeName={engine.routeName}
        operatorName={engine.operatorName}
        equipmentName={engine.equipmentName}
        counter={snapshot.counter}
      />

      {/* Carte de la mission : tracé, marqueurs par statut, position + cap. */}
      <MissionMap
        stops={snapshot.allStops}
        activeOrdre={snapshot.activeMission?.stop.ordre ?? null}
        position={snapshot.position}
        className="mx-4 mb-3 h-[32svh] shrink-0 rounded-card"
      />

      {/* Bannière : perte de connexion (session conservée, reconnexion en cours). */}
      {sync.connectionLost && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-control border border-status-warning/30 bg-status-warning/10 px-3 py-2 text-label text-status-warning">
          <WifiOff className="size-3.5 shrink-0" aria-hidden="true" />
          Connexion perdue. Tentative de reconnexion…
        </div>
      )}

      {/* Contenu défilable */}
      <main className="flex-1 overflow-y-auto px-4 pb-3">
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
            {snapshot.activeMission ? (
              <CurrentMissionCard mission={snapshot.activeMission} />
            ) : (
              <EmptyHero running={running} allDone={snapshot.otherStops.length === 0} />
            )}

            {engine.gpsError && running && (
              <p className="flex items-center gap-1.5 px-1 text-label text-status-warning">
                <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
                {engine.gpsError}
              </p>
            )}

            <MissionCountersRow
              todoCount={todoCount}
              completedCount={snapshot.completedCount}
              reportedCount={reportedCount}
              totalCount={snapshot.totalCount}
            />

            {snapshot.otherStops.length > 0 && (
              <>
                <StopListHeader />
                <StopList stops={snapshot.otherStops} />
              </>
            )}
          </div>
        )}
      </main>

      <MissionFooter
        canReportProblem={snapshot.activeMission !== null}
        onProblem={() => setProblemOpen(true)}
        voiceEnabled={snapshot.config.voiceEnabled}
        onToggleVoice={() => engine.setConfig({ voiceEnabled: !snapshot.config.voiceEnabled })}
        onMoreOptions={() => setOptionsOpen(true)}
      />

      <ProblemModal
        open={problemOpen}
        onSelect={handleSelectProblem}
        onClose={() => setProblemOpen(false)}
      />

      <MissionOptionsSheet
        open={optionsOpen}
        phase={snapshot.phase}
        onPlay={engine.play}
        onPause={engine.pause}
        onStop={engine.stop}
        config={snapshot.config}
        onChange={engine.setConfig}
        onTestVoice={voice.testVoice}
        voiceName={voice.voiceName}
        onClose={() => setOptionsOpen(false)}
      />
    </div>
  )
}

function NoMissionScreen({
  onRefresh,
  isRefreshing,
}: {
  onRefresh: () => void
  isRefreshing: boolean
}) {
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center bg-surface-bg px-6 text-center">
      <div className="w-full max-w-[420px] rounded-card border border-border-subtle bg-surface-card p-8">
        <h1 className="text-section font-semibold text-text">Aucune mission assignée</h1>
        <p className="mt-2 text-body text-text-muted">
          Veuillez communiquer avec votre répartiteur.
        </p>
        <Button
          variant="secondary"
          className="mt-6 w-full"
          isLoading={isRefreshing}
          onClick={onRefresh}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Actualiser
        </Button>
      </div>
    </div>
  )
}

function EmptyHero({ running, allDone }: { running: boolean; allDone: boolean }) {
  const message = allDone
    ? 'Tournée terminée. Toutes les résidences ont été traitées.'
    : running
      ? 'Acquisition du signal GPS…'
      : 'Appuyez sur Play pour démarrer la tournée.'

  return (
    <section className="flex h-40 items-center justify-center rounded-card border border-border-subtle bg-surface-card p-6 text-center">
      <p className="text-body text-text-muted">{message}</p>
    </section>
  )
}
