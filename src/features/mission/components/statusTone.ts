import type { StatusTone } from '../domain/status'

/**
 * Traduction du `tone` abstrait (domaine) en classes utilitaires (couche UI).
 * Centralisé ici pour être partagé par `StopRow`, `CurrentMissionCard` et
 * `SmartCounter` — le domaine ne connaît jamais ces classes.
 */
export type ToneClasses = {
  text: string
  pill: string
  pillIcon: string
  rowBorder: string
  rowBg: string
}

export const TONE_CLASSES: Record<StatusTone, ToneClasses> = {
  neutral: {
    text: 'text-text-muted',
    pill: 'bg-surface-card-elevated border border-border-subtle',
    pillIcon: 'text-text-muted',
    rowBorder: 'border-border-subtle',
    rowBg: 'bg-surface-card',
  },
  accent: {
    text: 'text-accent-strong',
    pill: 'bg-accent',
    pillIcon: 'text-white',
    rowBorder: 'border-accent-border',
    rowBg: 'bg-accent-bg',
  },
  success: {
    text: 'text-status-success',
    pill: 'bg-status-success',
    pillIcon: 'text-white',
    rowBorder: 'border-border-subtle',
    rowBg: 'bg-surface-card',
  },
  warning: {
    text: 'text-status-warning',
    pill: 'bg-status-warning',
    pillIcon: 'text-white',
    rowBorder: 'border-border-subtle',
    rowBg: 'bg-surface-card',
  },
  danger: {
    text: 'text-status-danger',
    pill: 'bg-status-danger',
    pillIcon: 'text-white',
    rowBorder: 'border-border-subtle',
    rowBg: 'bg-surface-card',
  },
}
