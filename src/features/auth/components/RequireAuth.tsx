import { Loader2 } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useSession } from '../hooks/useSession'
import { AccessDenied } from './AccessDenied'
import type { Role } from '../types/auth.types'

function FullscreenLoader() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-surface-bg">
      <Loader2 className="size-6 animate-spin text-text-muted" aria-hidden="true" />
    </div>
  )
}

export function RequireAuth() {
  const { data: session, isLoading } = useSession()
  const location = useLocation()

  if (isLoading) {
    return <FullscreenLoader />
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

type RequireRoleProps = {
  roles: Role[]
}

export function RequireRole({ roles }: RequireRoleProps) {
  const { data: session, isLoading } = useSession()

  if (isLoading) {
    return <FullscreenLoader />
  }

  if (!session || !roles.includes(session.user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

/**
 * Garde de rôle spécifique à RECA Operator : après authentification, on vérifie
 * **immédiatement** que l'utilisateur est un opérateur. Sinon, l'écran « Accès
 * refusé » plein écran est rendu (pas de redirection — l'app est mono-écran).
 *
 * Note : le rôle `operateur` n'existe pas encore dans la table `users` partagée avec
 * RECA App (migration prévue côté reca-app) ; ce garde prépare la vérification sans
 * solution temporaire — tant que le rôle n'est pas attribué, l'accès est refusé.
 */
export function RequireOperator() {
  const { data: session, isLoading } = useSession()
  const location = useLocation()

  if (isLoading) {
    return <FullscreenLoader />
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (session.user.role !== 'operateur') {
    return <AccessDenied />
  }

  return <Outlet />
}
