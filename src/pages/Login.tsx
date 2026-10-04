import { useState, type FormEvent } from 'react'
import { Plane, Fingerprint, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../context/AuthContext'

interface LoginProps {
  onSuccess: () => void
}

export function Login({ onSuccess }: LoginProps) {
  const { login, loginWithBiometric } = useAuth()
  const [employeeNumber, setEmployeeNumber] = useState('12345')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [bioLoading, setBioLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await login(employeeNumber, code)
    setLoading(false)
    if (result.ok) onSuccess()
    else setError(result.error ?? 'Ошибка входа')
  }

  const handleBio = async () => {
    setError(null)
    setBioLoading(true)
    const result = await loginWithBiometric()
    setBioLoading(false)
    if (result.ok) onSuccess()
    else setError(result.error ?? 'Биометрия недоступна')
  }

  return (
    <div className="min-h-dvh app-bg flex flex-col safe-top safe-bottom px-5 pb-8">
      <div className="pt-10 pb-8 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lavender-500 to-lavender-700 flex items-center justify-center shadow-lg shadow-lavender-500/25 mb-4">
          <Plane className="w-7 h-7 text-white -rotate-45" />
        </div>
        <h1 className="text-h1 text-navy-800 dark:text-navy-50">AeroDesk</h1>
        <p className="text-caption text-navy-400 mt-1">Вход для сотрудников</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="space-y-4 animate-in">
          <Input
            id="employee"
            label="Табельный номер"
            inputMode="numeric"
            autoComplete="username"
            placeholder="12345"
            value={employeeNumber}
            onChange={(e) => setEmployeeNumber(e.target.value)}
            error={undefined}
          />
          <Input
            id="code"
            label="Код доступа"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            placeholder="••••"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={error ?? undefined}
          />
        </div>

        <div className="mt-auto pt-8 space-y-3">
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Вход…
              </>
            ) : (
              'Войти'
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={handleBio}
            disabled={bioLoading}
          >
            {bioLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Fingerprint className="w-5 h-5 mr-2" />
            )}
            Войти с Face ID
          </Button>

          <p className="text-center text-caption text-navy-400 pt-2">
            Демо: любой код от 4 цифр · 0000 — ошибка
          </p>
        </div>
      </form>
    </div>
  )
}
