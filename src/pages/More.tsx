import { useNavigate } from 'react-router-dom'
import {
  Accessibility,
  FileStack,
  Bell,
  Settings,
  LayoutGrid,
  ChevronRight,
  Moon,
  Plane,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

const links = [
  { to: '/special-passengers', label: 'Особые пассажиры', icon: Accessibility, desc: 'Памятки и чеклисты' },
  { to: '/tabs', label: 'Мои вкладки', icon: LayoutGrid, desc: 'Чеклисты и заметки' },
  { to: '/notifications', label: 'Уведомления', icon: Bell, desc: 'Гейты, задержки, посадка' },
  { to: '/settings', label: 'Настройки', icon: Settings, desc: 'Тема и язык' },
  { to: '/documents', label: 'Документы', icon: FileStack, desc: 'Правила АК и ФАП' },
]

export function More() {
  const navigate = useNavigate()
  const { actualTheme, setTheme } = useTheme()

  return (
    <div className="min-h-dvh page-pad app-bg">
      <header className="sticky top-0 z-40 glass border-b border-lavender-500/25 safe-top">
        <div className="page-wrap py-3 sm:py-4">
          <h1 className="text-h1 text-lavender-200">Ещё</h1>
        </div>
      </header>

      <main className="page-wrap py-4 sm:py-5 space-y-4">
        <Card variant="elevated" className="p-4 flex items-center gap-3 bg-[#2a2a32] border-lavender-500/30">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lavender-500 to-lavender-700 flex items-center justify-center shrink-0">
            <Plane className="w-6 h-6 text-white -rotate-45" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-semibold text-navy-800 dark:text-navy-100">AeroDesk</div>
            <div className="text-caption text-navy-400">Авиа-помощник · открытый доступ</div>
          </div>
          <Button
            variant="ghost"
            className="px-3"
            onClick={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Тема"
          >
            <Moon className="w-5 h-5" />
          </Button>
        </Card>

        <Card variant="elevated" className="divide-y divide-lavender-100 dark:divide-navy-700 overflow-hidden">
          {links.map(({ to, label, icon: Icon, desc }) => (
            <button
              key={to}
              type="button"
              onClick={() => navigate(to)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-lavender-50/80 dark:hover:bg-navy-700/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-lavender-100 dark:bg-lavender-900/40 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-lavender-600 dark:text-lavender-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-navy-800 dark:text-navy-100">{label}</div>
                <div className="text-caption text-navy-400">{desc}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-navy-300" />
            </button>
          ))}
        </Card>
      </main>
    </div>
  )
}
