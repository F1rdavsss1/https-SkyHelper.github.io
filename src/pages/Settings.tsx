import { Card } from '../components/ui/Card'
import { useTheme } from '../context/ThemeContext'
import { Moon, Sun, Monitor, Bell, Globe } from 'lucide-react'
import { useState } from 'react'

export function Settings() {
  const { theme, setTheme } = useTheme()
  const [toggles, setToggles] = useState({
    flight: true,
    gate: true,
    boarding: true,
  })

  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-12 h-7 rounded-full relative transition-colors ${
        on ? 'bg-lavender-600' : 'bg-navy-300 dark:bg-navy-600'
      }`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
          on ? 'right-1' : 'left-1'
        }`}
      />
    </button>
  )

  return (
    <div className="min-h-dvh page-pad app-bg">
      <header className="sticky top-0 z-40 glass border-b border-lavender-500/25 safe-top">
        <div className="page-wrap py-3 sm:py-4">
          <h1 className="text-h1 text-lavender-200">Настройки</h1>
        </div>
      </header>

      <main className="page-wrap py-4 sm:py-5 space-y-6">
        <section>
          <h2 className="text-h2 text-lavender-200 mb-3">Внешний вид</h2>
          <Card variant="elevated" className="p-2 bg-[#2a2a32] border-lavender-500/30">
            {(
              [
                { id: 'light' as const, label: 'Светлая', icon: Sun, color: 'text-amber-500' },
                { id: 'dark' as const, label: 'Тёмная', icon: Moon, color: 'text-lavender-500' },
                { id: 'system' as const, label: 'Системная', icon: Monitor, color: 'text-navy-500' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  theme === opt.id
                    ? 'bg-lavender-100 dark:bg-lavender-900/30 ring-2 ring-lavender-500'
                    : 'hover:bg-lavender-50 dark:hover:bg-navy-800'
                }`}
              >
                <opt.icon className={`w-5 h-5 ${opt.color}`} />
                <span className="text-[15px] text-lavender-100">{opt.label}</span>
              </button>
            ))}
          </Card>
        </section>

        <section>
          <h2 className="text-h2 text-lavender-200 mb-3">Уведомления</h2>
          <Card variant="elevated" className="divide-y divide-lavender-100 dark:divide-navy-700">
            {(
              [
                { key: 'flight' as const, label: 'Изменения рейса' },
                { key: 'gate' as const, label: 'Изменение гейта' },
                { key: 'boarding' as const, label: 'Начало посадки' },
              ] as const
            ).map((row) => (
              <div key={row.key} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-lavender-500" />
                  <span className="text-[15px] text-lavender-100">{row.label}</span>
                </div>
                <Toggle
                  on={toggles[row.key]}
                  onClick={() => setToggles((t) => ({ ...t, [row.key]: !t[row.key] }))}
                />
              </div>
            ))}
          </Card>
        </section>

        <section>
          <h2 className="text-h2 text-lavender-200 mb-3">Язык</h2>
          <Card variant="elevated" className="p-4 flex items-center gap-3">
            <Globe className="w-5 h-5 text-lavender-500" />
            <div>
              <div className="text-[15px] font-medium text-lavender-100">Русский</div>
              <div className="text-caption text-navy-400">English · 日本語 (soon)</div>
            </div>
          </Card>
        </section>

        <p className="text-center text-caption text-navy-400">AeroDesk v1.0.0</p>
      </main>
    </div>
  )
}
