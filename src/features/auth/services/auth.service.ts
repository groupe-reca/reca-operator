import type { Session as SupabaseSession, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import type { AuthError, LoginCredentials, Role, Session, User } from '../types/auth.types'

type PublicUserRow = {
  role: Role
  actif: boolean
  derniere_connexion: string | null
  nom: string | null
}

async function mapUser(user: SupabaseUser): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .select('role, actif, derniere_connexion, nom')
    .eq('id', user.id)
    .single<PublicUserRow>()

  if (error || !data) {
    throw {
      code: 'ACCOUNT_DISABLED',
      message: "Votre profil n'est pas encore configuré. Contactez un administrateur.",
    } satisfies AuthError
  }

  if (!data.actif) {
    await supabase.auth.signOut()
    throw {
      code: 'ACCOUNT_DISABLED',
      message: 'Votre compte est désactivé. Contactez un administrateur.',
    } satisfies AuthError
  }

  return {
    id: user.id,
    email: user.email ?? '',
    nom: data.nom,
    role: data.role,
    actif: data.actif,
    derniereConnexion: data.derniere_connexion,
  }
}

async function mapSession(session: SupabaseSession): Promise<Session> {
  return {
    user: await mapUser(session.user),
    accessToken: session.access_token,
    expiresAt: (session.expires_at ?? 0) * 1000,
  }
}

export async function signInWithPassword(credentials: LoginCredentials): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword(credentials)

  if (error || !data.session) {
    const authError: AuthError = {
      code: 'INVALID_CREDENTIALS',
      message:
        error?.message === 'Email not confirmed'
          ? 'Veuillez confirmer votre courriel avant de vous connecter.'
          : 'Courriel ou mot de passe invalide.',
    }
    throw authError
  }

  return mapSession(data.session)
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session ? mapSession(data.session) : null
}
