import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Square,
  Volume2,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DEFAULT_ENGINE_CONFIG } from '../domain/config'
import type { EngineConfig } from '../domain/config'
import type { MissionPhase } from '../domain/types'

type MissionOptionsSheetProps = {
  open: boolean
  phase: MissionPhase
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  config: EngineConfig
  onChange: (patch: Partial<EngineConfig>) => void
  onTestVoice: () => void
  voiceName: string | null
  onClose: () => void
}

/** Clés numériques réglables (les booléens dev/voix sont traités à part). */
type NumericKey = Exclude<keyof EngineConfig, 'devControls' | 'voiceEnabled' | VoiceCategoryKey>

type NumericField = {
  key: NumericKey
  label: string
  unit: string
  min: number
  max: number
  step: number
  /** Valeur affichée = valeur stockée / `factor` (ms → s : factor 1000). */
  factor: number
  hint?: string
}

/**
 * Paramètres numériques du moteur, dans l'ordre du panneau « PARAMÈTRES ACTUELS »
 * de la maquette. Les délais sont stockés en ms mais réglés en secondes.
 */
const NUMERIC_FIELDS: NumericField[] = [
  { key: 'arrivalRadiusMeters', label: 'Rayon de détection', unit: 'm', min: 5, max: 200, step: 5, factor: 1 },
  { key: 'approachDelayMs', label: 'Délai avant EN COURS', unit: 's', min: 0, max: 300, step: 5, factor: 1000 },
  { key: 'departDelayMs', label: 'Délai avant TERMINÉ', unit: 's', min: 0, max: 300, step: 5, factor: 1000 },
  { key: 'departSpeedKmh', label: 'Vitesse de départ min', unit: 'km/h', min: 1, max: 40, step: 1, factor: 1 },
  {
    key: 'lowSpeedKmh',
    label: 'Vitesse arrêt max',
    unit: 'km/h',
    min: 1,
    max: 20,
    step: 1,
    factor: 1,
    hint: 'Réservé — pas encore branché dans la logique',
  },
]

/** Clés booléennes des catégories d'annonces vocales. */
type VoiceCategoryKey = 'voiceStart' | 'voiceNextAddress' | 'voiceSide' | 'voiceAlerts' | 'voiceEnd'

const VOICE_CATEGORIES: { key: VoiceCategoryKey; label: string; hint: string }[] = [
  { key: 'voiceStart', label: 'Début de mission', hint: '« Mission démarrée. »' },
  { key: 'voiceNextAddress', label: 'Prochaine adresse', hint: 'À chaque changement de mission actuelle.' },
  { key: 'voiceSide', label: 'Gauche / Droite', hint: 'Côté de la résidence, si le calcul est fiable.' },
  { key: 'voiceAlerts', label: 'Alertes critiques', hint: "Note opérateur, lue à l'approche." },
  { key: 'voiceEnd', label: 'Fin de mission', hint: '« Mission terminée. »' },
]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Valeur affichée (unités « humaines ») d'un champ à partir de la config. */
const displayValue = (config: EngineConfig, field: NumericField) =>
  config[field.key] / field.factor

/**
 * Feuille « Plus d'options » — point d'entrée **production** (plus de gating
 * dev) pour le contrôle manuel (Play/Pause/Stop, migré depuis l'ancienne
 * `DevControlBar`) et le réglage runtime de tous les paramètres du moteur.
 * Purement présentationnelle : elle lit la config/phase courantes et remonte
 * chaque changement via les callbacks (→ `MissionEngine`).
 */
export function MissionOptionsSheet({
  open,
  phase,
  onPlay,
  onPause,
  onStop,
  config,
  onChange,
  onTestVoice,
  voiceName,
  onClose,
}: MissionOptionsSheetProps) {
  // Brouillon local des champs texte : permet une saisie libre (champ vide,
  // frappe intermédiaire) sans reformater à chaque touche.
  const [draft, setDraft] = useState<Record<NumericKey, string>>(() => seedDraft(config))

  // Ré-amorce le brouillon à chaque (ré)ouverture, sans effet : patron React de
  // stockage d'info entre rendus (détection de la transition fermé → ouvert).
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setDraft(seedDraft(config))
  }

  const commit = (field: NumericField, shown: number) => {
    const clamped = clamp(shown, field.min, field.max)
    setDraft((d) => ({ ...d, [field.key]: String(clamped) }))
    onChange({ [field.key]: Math.round(clamped * field.factor) } as Partial<EngineConfig>)
  }

  const handleType = (field: NumericField, raw: string) => {
    setDraft((d) => ({ ...d, [field.key]: raw }))
    const parsed = Number.parseFloat(raw)
    if (Number.isFinite(parsed)) {
      onChange({ [field.key]: Math.round(clamp(parsed, field.min, field.max) * field.factor) } as Partial<EngineConfig>)
    }
  }

  const resetAll = () => {
    setDraft(seedDraft(DEFAULT_ENGINE_CONFIG))
    onChange({ ...DEFAULT_ENGINE_CONFIG })
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Plus d'options"
            className="max-h-[90svh] w-full overflow-y-auto rounded-t-modal border-t border-border-subtle bg-surface-card p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-subtitle font-semibold text-text">
                <SlidersHorizontal className="size-5 text-accent-strong" aria-hidden="true" />
                Plus d'options
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="flex size-9 items-center justify-center rounded-full bg-surface-card-elevated text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 px-1 text-label font-semibold uppercase tracking-wide text-text-muted">
                Contrôle manuel
              </h3>
              <div className="flex gap-2">
                <PhaseButton icon={Play} label="Play" colorClass="bg-status-success" active={phase === 'RUNNING'} onClick={onPlay} />
                <PhaseButton icon={Pause} label="Pause" colorClass="bg-status-warning" active={phase === 'PAUSED'} onClick={onPause} />
                <PhaseButton icon={Square} label="Stop" colorClass="bg-status-danger" active={phase === 'STOPPED'} onClick={onStop} />
              </div>
            </div>

            <p className="mb-4 text-label text-text-faint">
              Réglage en direct — les changements s'appliquent immédiatement. Non persistant :
              rechargez pour revenir aux valeurs par défaut.
            </p>

            <div className="flex flex-col gap-2">
              {NUMERIC_FIELDS.map((field) => (
                <NumberRow
                  key={field.key}
                  field={field}
                  value={draft[field.key]}
                  onType={(raw) => handleType(field, raw)}
                  onStep={(dir) => commit(field, displayValue(config, field) + dir * field.step)}
                />
              ))}

              <ToggleRow
                label="Mode développement"
                hint="Désactivé : le moteur démarre automatiquement. Activé : attend un Play manuel."
                checked={config.devControls}
                onToggle={() => onChange({ devControls: !config.devControls })}
              />
            </div>

            <div className="mt-4">
              <h3 className="mb-2 flex items-center gap-2 px-1 text-label font-semibold uppercase tracking-wide text-text-muted">
                <Volume2 className="size-4 text-accent-strong" aria-hidden="true" />
                Assistance vocale
              </h3>
              <div className="flex flex-col gap-2">
                <ToggleRow
                  label="Assistance vocale"
                  hint="Interrupteur général. Coupé : aucune annonce."
                  checked={config.voiceEnabled}
                  onToggle={() => onChange({ voiceEnabled: !config.voiceEnabled })}
                />

                {VOICE_CATEGORIES.map((cat) => (
                  <ToggleRow
                    key={cat.key}
                    label={cat.label}
                    hint={cat.hint}
                    checked={config[cat.key]}
                    onToggle={() => onChange({ [cat.key]: !config[cat.key] } as Partial<EngineConfig>)}
                  />
                ))}

                <button
                  type="button"
                  onClick={onTestVoice}
                  disabled={!config.voiceEnabled}
                  className="flex w-full items-center justify-center gap-2 rounded-card border border-border-subtle bg-surface-card-elevated py-2.5 text-body font-medium text-text transition-colors duration-150 hover:border-accent-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Volume2 className="size-4 text-accent-strong" aria-hidden="true" />
                  Tester la voix
                </button>
                <p className="px-1 text-[11px] text-text-faint">
                  Voix : {voiceName ?? '(voix par défaut du système)'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={resetAll}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-control border border-border-subtle bg-surface-card-elevated py-2.5 text-body font-medium text-text-muted transition-colors duration-150 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Réinitialiser les valeurs par défaut
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function seedDraft(config: EngineConfig): Record<NumericKey, string> {
  const out = {} as Record<NumericKey, string>
  for (const field of NUMERIC_FIELDS) out[field.key] = String(displayValue(config, field))
  return out
}

type PhaseButtonProps = {
  icon: LucideIcon
  label: string
  colorClass: string
  active: boolean
  onClick: () => void
}

function PhaseButton({ icon: Icon, label, colorClass, active, onClick }: PhaseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-control py-2.5 text-white transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${colorClass} ${
        active ? 'ring-2 ring-white/70' : 'opacity-90 hover:opacity-100'
      }`}
    >
      <Icon className="size-5" aria-hidden="true" />
      <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
    </button>
  )
}

type NumberRowProps = {
  field: NumericField
  value: string
  onType: (raw: string) => void
  onStep: (dir: -1 | 1) => void
}

function NumberRow({ field, value, onType, onStep }: NumberRowProps) {
  return (
    <div className="rounded-card border border-border-subtle bg-surface-card-elevated px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-body font-medium text-text">{field.label}</p>
          {field.hint && <p className="mt-0.5 text-[11px] text-text-faint">{field.hint}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <StepButton icon={Minus} label={`Diminuer ${field.label}`} onClick={() => onStep(-1)} />
          <div className="flex items-baseline gap-1 rounded-control bg-surface-card px-1">
            <input
              type="number"
              inputMode="decimal"
              value={value}
              min={field.min}
              max={field.max}
              step={field.step}
              onChange={(e) => onType(e.target.value)}
              aria-label={`${field.label} (${field.unit})`}
              className="w-12 bg-transparent py-1.5 text-right text-body font-semibold tabular-nums text-text focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="pr-1.5 text-label text-text-faint">{field.unit}</span>
          </div>
          <StepButton icon={Plus} label={`Augmenter ${field.label}`} onClick={() => onStep(1)} />
        </div>
      </div>
    </div>
  )
}

function StepButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-control border border-border-subtle bg-surface-card text-text-muted transition-colors duration-150 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  )
}

type ToggleRowProps = {
  label: string
  hint: string
  checked: boolean
  onToggle: () => void
}

function ToggleRow({ label, hint, checked, onToggle }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-card border border-border-subtle bg-surface-card-elevated px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-body font-medium text-text">{label}</p>
        <p className="mt-0.5 text-[11px] text-text-faint">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
          checked ? 'bg-accent' : 'bg-surface-card'
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform duration-200 ${
            checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}
