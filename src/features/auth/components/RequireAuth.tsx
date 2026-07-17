import { Loader2 } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useSession } from '../hooks/useSession'
import type { Role } from '../types/auth.types'

function FullscreenLoader() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-surface-bg">
      <Loader2 className="size-6 animate-spin text-text-muted" aria-hidden="true" />
    </div>
  )
}

/**
 * Contournement d'auth réservé au développement, pour prévisualiser l'écran
 * mission avant que les clés Supabase partagées soient renseignées. Activé
 * uniquement en mode DEV ET avec VITE_PREVIEW_MISSION=1 (voir .env.example).
 * N'a aucun effet en production.
 */
const PREVIEW_BYPASS =
  import.meta.env.DEV && import.meta.env.VITE_PREVIEW_MISSION === '1'

export function RequireAuth() {
  const { data: session, isLoading } = useSession()
  const location = useLocation()

  if (PREVIEW_BYPASS) {
    return <Outlet />
  }

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
