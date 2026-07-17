import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router'
import * as authService from '../services/auth.service'
import { sessionQueryKey } from './useSession'
import type { AuthError, LoginCredentials, Session } from '../types/auth.types'

export function useLogin() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()

  return useMutation<Session, AuthError, LoginCredentials>({
    mutationFn: (credentials) => authService.signInWithPassword(credentials),
    onSuccess: (session) => {
      queryClient.setQueryData(sessionQueryKey, session)
      const from = (location.state as { from?: { pathname: string } } | null)?.from
      navigate(from?.pathname ?? '/', { replace: true })
    },
  })
}
