import { useState } from 'react'
import { Loader2, RefreshCw, TriangleAlert, WifiOff } from 'lucide-react'
import { MissionTopOverlay } from '../components/MissionTopOverlay'
import { MapFloatingButtons } from '../components/MapFloatingButtons'
import { DevPanelTrigger } from '../components/DevPanelTrigger'
import { MissionMap } from '../components/map/MissionMap'
import { CurrentMissionCard } from '../components/CurrentMissionCard'
import { StopListDrawer } from '../components/StopListDrawer'
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
  const activeStop = snapshot.activeMission?.stop ?? null
  const navigationHref = activeStop ? `https://maps.google.com/?q=${activeStop.lat},${activeStop.lng}` : null

  return (
    <div className="relative h-[100svh] w-screen overflow-hidden bg-surface-bg">
      {/* Carte plein écran — élément central de l'interface (cf. design3.txt). */}
      <MissionMap
        stops={snapshot.allStops}
        activeOrdre={activeStop?.ordre ?? null}
        position={snapshot.position}
        className="absolute inset-0"
      />

      <MissionTopOverlay
        missionLabel={engine.missionLabel}
        routeName={engine.routeName}
        operatorName={engine.operatorName}
        equipmentName={engine.equipmentName}
        counter={snapshot.counter}
        voiceEnabled={snapshot.config.voiceEnabled}
        onToggleVoice={() => engine.setConfig({ voiceEnabled: !snapshot.config.voiceEnabled })}
      />

      <MapFloatingButtons
        navigationHref={navigationHref}
        canReportProblem={snapshot.activeMission !== null}
        onProblem={() => setProblemOpen(true)}
        onOptions={() => setOptionsOpen(true)}
      />

      {/* Déclencheur du panneau de développement (Play/Pause/Stop) — disparaît
          si `devControls` est désactivé (vrai déploiement terrain). */}
      {snapshot.config.devControls && <DevPanelTrigger onOpen={() => setOptionsOpen(true)} />}

      {/* Pile flottante du bas : bannière connexion, carte « prochaine résidence », tiroir résidences. */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        {sync.connectionLost && (
          <div className="flex items-center gap-2 rounded-control border border-status-warning/30 bg-status-warning/20 px-3 py-2 text-label text-status-warning backdrop-blur-md">
            <WifiOff className="size-3.5 shrink-0" aria-hidden="true" />
            Connexion perdue. Tentative de reconnexion…
          </div>
        )}

        {engine.gpsError && running && (
          <p className="flex items-center gap-1.5 rounded-control bg-surface-card/70 px-3 py-1.5 text-label text-status-warning backdrop-blur-md">
            <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
            {engine.gpsError}
          </p>
        )}

        {engine.isLoading ? (
          <div className="flex h-32 items-center justify-center rounded-card border border-white/10 bg-surface-card/75 backdrop-blur-md">
            <Loader2 className="size-6 animate-spin text-text-muted" aria-hidden="true" />
          </div>
        ) : engine.error ? (
          <p className="flex items-center justify-center gap-2 rounded-card border border-white/10 bg-surface-card/75 p-4 text-body text-status-danger backdrop-blur-md">
            <TriangleAlert className="size-4" aria-hidden="true" />
            Impossible de charger la tournée.
          </p>
        ) : (
          <>
            {snapshot.activeMission ? (
              <CurrentMissionCard mission={snapshot.activeMission} />
            ) : (
              <EmptyHero running={running} allDone={snapshot.otherStops.length === 0} />
            )}

            <StopListDrawer
              stops={snapshot.otherStops}
              completedCount={snapshot.completedCount}
              reportedCount={reportedCount}
            />
          </>
        )}
      </div>

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
    <section className="flex h-32 items-center justify-center rounded-card border border-white/10 bg-surface-card/75 p-6 text-center shadow-lg shadow-black/40 backdrop-blur-md">
      <p className="text-body text-text-muted">{message}</p>
    </section>
  )
}
