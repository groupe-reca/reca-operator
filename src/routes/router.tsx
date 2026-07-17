import { createBrowserRouter, Navigate } from 'react-router'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RequireAuth } from '@/features/auth/components/RequireAuth'
import { MissionPage } from '@/features/mission/pages/MissionPage'

/**
 * Routing minimal — une seule mission (aucun menu, aucune navigation).
 * `/login` public ; l'écran mission (`/`) est protégé par l'authentification.
 */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [{ index: true, element: <MissionPage /> }],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
