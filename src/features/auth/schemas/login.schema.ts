import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Le courriel est requis').email('Courriel invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
