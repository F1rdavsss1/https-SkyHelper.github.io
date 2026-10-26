import { NavLink } from 'react-router-dom'
import { Search, Menu, MessageSquareText, Phone, User, MoreHorizontal, Send } from 'lucide-react'
import { cn } from '../lib/utils'

/** Телефон — 4 вкладки (как в макете), компьютер — боковое меню с «Ещё» */
const mobileTabs = [
  { to: '/', label: 'Поиск', icon: Search, end: true },
  { to: '/flights', label: 'Рейсы', icon: Menu },
  { to: '/knowledge', label: 'Справ.', icon: MessageSquareText },
  { to: '/contacts', label: 'Связь', icon: Phone },
]

const desktopTabs = [
  { to: '/', label: 'Главная', icon: Search, end: true },
  { to: '/flights', label: 'Рейсы', icon: Menu },
  { to: '/knowledge', label: 'Справочник', icon: MessageSquareText },
  { to: '/contacts', label: 'Контакты', icon: User },
  { to: '/more', label: 'Ещё', icon: MoreHorizontal },
]

export function BottomNav() {
  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 glass border-t border-lavender-500/20 safe-bottom"
        aria-label="Основная навигация"
      >
        <div className="flex items-stretch justify-around gap-1 h-[4.25rem] px-2 max-w-lg mx-auto w-full py-1.5">
          {mobileTabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 flex-1 min-w-0 rounded-2xl transition-colors',
                  isActive ? 'bg-lavender-600/25 text-lavender-100' : 'text-navy-400 hover:text-lavender-200',
                )
              }
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
              <span className="text-[11px] font-medium leading-tight">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 w-56 flex-col border-r border-lavender-500/15 bg-[#17171c] safe-top">
        <div className="px-4 pt-6 pb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lavender-500 to-lavender-700 flex items-center justify-center shadow-lg shadow-lavender-900/40">
            <Send className="w-5 h-5 text-white -rotate-12" />
          </div>
          <div>
            <div className="text-[16px] font-bold text-lavender-50 leading-tight">AeroDesk</div>
            <p className="text-[11.5px] text-navy-400">Пулково · регистрация</p>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto" aria-label="Основная навигация">
          {desktopTabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors',
                  isActive
                    ? 'bg-lavender-600/25 text-lavender-50'
                    : 'text-navy-300 hover:bg-lavender-600/10 hover:text-lavender-200',
                )
              }
            >
              <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
