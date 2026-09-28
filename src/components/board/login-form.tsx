'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { boardHref } from '@/lib/board-path'
import { createBrowserSupabase } from '@/lib/supabase'

const field =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-ink'

export function LoginForm({ base }: { base: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const { error: authError } = await createBrowserSupabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError) {
      // Message volontairement vague : ne pas révéler si l'adresse existe.
      setError('Identifiants incorrects.')
      setSubmitting(false)
      return
    }

    router.replace(boardHref(base, ''))
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-line bg-card p-6 shadow-sm">
      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <label className="block text-sm font-medium text-graphite" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        type="email"
        autoComplete="email"
        required
        className={`mt-1.5 ${field}`}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <label className="mt-4 block text-sm font-medium text-graphite" htmlFor="password">
        Mot de passe
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        required
        className={`mt-1.5 ${field}`}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  )
}
