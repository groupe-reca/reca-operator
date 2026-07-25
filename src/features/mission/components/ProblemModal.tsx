import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { PROBLEM_CODES } from '../domain/problemCodes'
import type { ProblemCode } from '../domain/problemCodes'

type ProblemModalProps = {
  open: boolean
  onSelect: (code: ProblemCode) => void
  onClose: () => void
}

/**
 * Modale des 8 codes « problème ». Après sélection, le parent enregistre le code
 * (statut NON_TERMINE) et referme automatiquement pour revenir à la mission.
 */
export function ProblemModal({ open, onSelect, onClose }: ProblemModalProps) {
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
            aria-label="Signaler un problème"
            className="w-full rounded-t-modal border-t border-border-subtle bg-surface-card p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-subtitle font-semibold text-text">Signaler un problème</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="flex size-9 items-center justify-center rounded-full bg-surface-card-elevated text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PROBLEM_CODES.map(({ code, label, icon: Icon }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => onSelect(code)}
                  className="flex items-center gap-3 rounded-card border border-border-subtle bg-surface-card-elevated p-3 text-left transition-colors duration-150 hover:border-accent-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-card text-status-danger">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] text-text-faint">{code}</span>
                    <span className="block truncate text-body font-medium text-text">{label}</span>
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
