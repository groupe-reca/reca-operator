import { motion } from 'motion/react'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLogout } from '../hooks/useLogout'

/**
 * Écran plein écran affiché lorsqu'un utilisateur authentifié n'a **pas** le rôle
 * opérateur : RECA Operator est réservé aux opérateurs terrain. Aucune autre
 * interface n'est accessible. Un bouton de déconnexion permet de changer de compte.
 */
export function AccessDenied() {
  const logout = useLogout()

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-surface-bg px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-[420px] rounded-card border border-border-subtle bg-surface-card p-8 text-center shadow-lg"
      >
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-status-danger/15">
          <ShieldAlert className="size-6 text-status-danger" aria-hidden="true" />
        </div>
        <h1 className="text-section font-semibold text-text">Accès refusé</h1>
        <p className="mt-2 text-body text-text-muted">
          Votre compte n'est pas autorisé à utiliser RECA Operator.
        </p>
        <Button
          variant="secondary"
          className="mt-6 w-full"
          isLoading={logout.isPending}
          onClick={() => logout.mutate()}
        >
          Se déconnecter
        </Button>
      </motion.div>
    </div>
  )
}
