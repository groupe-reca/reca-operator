import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import * as authService from '../services/auth.service'

export const sessionQueryKey = ['session'] as const

export function useSession() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: sessionQueryKey })
    })
    return () => subscription.subscription.unsubscribe()
  }, [queryClient])

  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: authService.getSession,
    staleTime: Infinity,
  })
}
