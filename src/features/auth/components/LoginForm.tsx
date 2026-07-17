import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Lock, Mail, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useLogin } from '../hooks/useLogin'
import { loginSchema } from '../schemas/login.schema'
import type { LoginFormValues } from '../schemas/login.schema'

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const login = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
  })

  const serverError = login.error

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit((values) => login.mutate(values))}
      noValidate
    >
      {serverError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-control border border-status-danger/40 bg-status-danger/10 px-3 py-2.5 text-label text-status-danger"
        >
          <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
          {serverError.message}
        </div>
      )}

      <Input
        label="Courriel"
        type="email"
        icon={Mail}
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <div className="relative">
        <Input
          label="Mot de passe"
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <button
          type="button"
          onClick={() => setShowPassword((value) => !value)}
          className="absolute right-3 top-[34px] text-text-muted hover:text-text"
          aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {showPassword ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <Button type="submit" isLoading={login.isPending} className="mt-2 w-full">
        Se connecter
      </Button>
    </form>
  )
}
