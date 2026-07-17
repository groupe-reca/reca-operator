import { motion } from 'motion/react'
import { LoginForm } from '../components/LoginForm'
import logo from '@/assets/logo-sombre.svg'

export function LoginPage() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-surface-bg px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-[420px] rounded-card border border-border-subtle bg-surface-card p-8 shadow-lg"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logo} alt="Groupe RECA" className="mb-4 h-20 w-auto object-contain" />
          <p className="text-label font-medium uppercase tracking-wide text-text-muted">
            Assistant opérateur
          </p>
          <h1 className="text-section font-semibold text-text">Connexion</h1>
        </div>

        <LoginForm />
      </motion.div>
    </div>
  )
}
