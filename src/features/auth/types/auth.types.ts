/**
 * Rôles de la plateforme Signa. La table `users` est partagée avec RECA App
 * (qui utilise `administrateur | employe`). On ajoute `operateur` pour l'app
 * terrain ; l'app tolère les trois valeurs sans imposer de migration en base.
 */
export type Role = 'administrateur' | 'operateur' | 'employe'

export type User = {
  id: string
  email: string
  nom: string | null
  role: Role
  actif: boolean
  derniereConnexion: string | null
}

export type Session = {
  user: User
  accessToken: string
  expiresAt: number
}

export type LoginCredentials = {
  email: string
  password: string
}

export type AuthError = {
  code: 'INVALID_CREDENTIALS' | 'ACCOUNT_DISABLED'
  message: string
}
