import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import * as authService from '../services/auth.service'
import { sessionQueryKey } from './useSession'

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authService.signOut,
    onSuccess: () => {
      queryClient.setQueryData(sessionQueryKey, null)
      navigate('/login', { replace: true })
    },
  })
}
