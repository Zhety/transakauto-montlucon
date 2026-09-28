import { LoginForm } from '@/components/board/login-form'
import { isSupabaseConfigured } from '@/lib/supabase'

export default function BoardLoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16">
      <div className="mb-8 text-center">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-[19px] font-semibold tracking-[0.18em]">TRANSAK</span>
          <span className="text-[19px] font-light tracking-[0.18em] text-accent">AUTO</span>
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Transakauto — Leads</h1>
        <p className="mt-2 text-sm text-muted">Connectez-vous pour accéder au tableau.</p>
      </div>

      {isSupabaseConfigured ? (
        <LoginForm />
      ) : (
        <div className="rounded-2xl border border-line bg-card p-6 text-sm leading-relaxed text-graphite">
          Le tableau n&apos;est pas encore relié à sa base de données. Renseignez
          <code className="mx-1 rounded bg-paper px-1.5 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> et
          <code className="mx-1 rounded bg-paper px-1.5 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          dans l&apos;environnement, puis redéployez.
        </div>
      )}
    </div>
  )
}
