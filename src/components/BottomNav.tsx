import { NavLink } from 'react-router-dom'
import { Search, Plane, FileText, Users, MoreHorizontal } from 'lucide-react'
import { cn } from '../lib/utils'

const tabs = [
  { to: '/', label: 'Главная', short: 'Поиск', icon: Search, end: true },
  { to: '/flights', label: 'Рейсы', short: 'Рейсы', icon: Plane },
  { to: '/documents', label: 'Документы', short: 'Доки', icon: FileText },
  { to: '/contacts', label: 'Контакты', short: 'Связь', icon: Users },
  { to: '/more', label: 'Ещё', short: 'Ещё', icon: MoreHorizontal },
]

function linkClass(isActive: boolean, desktop = false) {
  if (desktop) {
    return cn(
      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-colors',
      isActive
        ? 'bg-lavender-600/30 text-lavender-100 border border-lavender-500/40'
        : 'text-navy-300 hover:bg-lavender-600/15 hover:text-lavender-200 border border-transparent'
    )
  }
  return cn(
    'flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 max-w-[4.75rem] py-1.5 transition-colors duration-200',
    isActive ? 'text-lavender-300' : 'text-navy-400'
  )
}

export function BottomNav() {
  return (
    <>
      {/* Mobile / tablet bottom bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 glass border-t border-lavender-500/25 safe-bottom"
        aria-label="Основная навигация"
      >
        <div className="flex items-stretch justify-between h-[3.75rem] px-1 max-w-lg mx-auto w-full">
          {tabs.map(({ to, short, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => linkClass(isActive)}>
              <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
              <span className="text-[10px] font-medium leading-tight truncate w-full text-center px-0.5">
                {short}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Desktop side rail */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 w-56 flex-col glass border-r border-lavender-500/25 safe-top">
        <div className="px-4 pt-6 pb-4">
          <div className="text-[20px] font-bold text-lavender-200 tracking-tight">AeroDesk</div>
          <p className="text-[12px] text-navy-400 mt-1">Пулково · регистрация</p>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto" aria-label="Основная навигация">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => linkClass(isActive, true)}>
              <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
