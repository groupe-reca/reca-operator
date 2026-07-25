import { useState } from 'react'
import { Loader2, MapPin, RefreshCw, TriangleAlert, WifiOff } from 'lucide-react'
import { SmartCounter } from '../components/SmartCounter'
import { CurrentMissionCard } from '../components/CurrentMissionCard'
import { StopListHeader } from '../components/StopListHeader'
import { StopList } from '../components/StopList'
import { DevControlBar } from '../components/DevControlBar'
import { ProblemModal } from '../components/ProblemModal'
import { SettingsModal } from '../components/SettingsModal'
import { Button } from '@/components/ui/Button'
import { useMissionEngine } from '../hooks/useMissionEngine'
import { useVoiceBridge } from '../hooks/useVoiceBridge'
import { useMissionSync } from '../hooks/useMissionSync'
import { formatAccuracy } from '../domain/format'
import type { ProblemCode } from '../domain/problemCodes'

export function MissionPage() {
  const engine = useMissionEngine()
  const { snapshot } = engine
  const [problemOpen, setProblemOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

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

  return (
    <div className="flex h-[100svh] flex-col bg-surface-bg">
      {/* En-tête fixe : progression + GPS (dev) à gauche, compteur à droite */}
      <header className="flex shrink-0 items-start justify-between gap-4 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-2">
        <div className="min-w-0">
          <p className="text-label font-semibold uppercase tracking-wide text-text-muted">
            {snapshot.completedCount} / {snapshot.totalCount} terminées
          </p>
          {engine.devControls && (
            <p className="mt-1 flex items-center gap-1.5 text-label text-text-faint">
              <MapPin className="size-3.5 shrink-0 text-status-success" aria-hidden="true" />
              <span className="tabular-nums">{formatAccuracy(snapshot.position)}</span>
            </p>
          )}
        </div>
        <SmartCounter counter={snapshot.counter} />
      </header>

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

            {snapshot.otherStops.length > 0 && (
              <>
                <StopListHeader />
                <StopList stops={snapshot.otherStops} />
              </>
            )}
          </div>
        )}
      </main>

      {/* Barre de contrôle (dev uniquement) */}
      {engine.devControls && (
        <footer className="shrink-0">
          <DevControlBar
            phase={snapshot.phase}
            canReportProblem={snapshot.activeMission !== null}
            onPlay={engine.play}
            onPause={engine.pause}
            onStop={engine.stop}
            onProblem={() => setProblemOpen(true)}
            onSettings={() => setSettingsOpen(true)}
          />
        </footer>
      )}

      <ProblemModal
        open={problemOpen}
        onSelect={handleSelectProblem}
        onClose={() => setProblemOpen(false)}
      />

      <SettingsModal
        open={settingsOpen}
        config={snapshot.config}
        onChange={engine.setConfig}
        onTestVoice={voice.testVoice}
        voiceName={voice.voiceName}
        onClose={() => setSettingsOpen(false)}
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
