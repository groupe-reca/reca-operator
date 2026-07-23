import { createBrowserRouter, Navigate } from 'react-router'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RequireAuth, RequireOperator } from '@/features/auth/components/RequireAuth'
import { MissionPage } from '@/features/mission/pages/MissionPage'

/**
 * Routing minimal — une seule mission (aucun menu, aucune navigation).
 * `/login` public ; l'écran mission (`/`) exige une authentification **et** le rôle
 * opérateur (sinon écran « Accès refusé »).
 */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RequireOperator />,
        children: [{ index: true, element: <MissionPage /> }],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
