import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BookOpen, ChevronDown, RefreshCw, Search, SlidersHorizontal } from 'lucide-react'
import { getCheckInPhase, isActiveFlight, isDepartedFlight, useFlights } from '../context/FlightsContext'
import { useNotifications } from '../context/NotificationsContext'
import { cn, formatTime } from '../lib/utils'
import type { Flight } from '../types'

const HISTORY_KEY = 'aerodesk_search_history'

function readHistory(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function pushHistory(q: string) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([q, ...readHistory().filter((h) => h !== q)].slice(0, 12)))
  } catch {
    /* приватный режим и т.п. — история не обязательна */
  }
}

function departureTime(f: Flight): Date {
  if (f.delayMinutes && f.delayMinutes > 0) {
    return f.actualDeparture ?? new Date(f.scheduledDeparture.getTime() + f.delayMinutes * 60000)
  }
  return f.scheduledDeparture
}

/** Подпись под временем вылета: «посадка 23:52» / «план 00:10» / «по расписанию» */
function departureNote(f: Flight): string {
  if (f.delayMinutes && f.delayMinutes > 0) return `план ${formatTime(f.scheduledDeparture)}`
  if (f.status === 'boarding' && f.boardingStart) return `посадка ${formatTime(f.boardingStart)}`
  if (f.status === 'scheduled') return 'по расписанию'
  return 'по расписанию'
}

const PHASE_NOTE = {
  not_started: 'ещё не началась',
  open: 'открыта',
  closing_soon: 'скоро закроется',
  closed: 'закрыта',
} as const

function StatusPill({ f, className }: { f: Flight; className?: string }) {
  const map: Record<Flight['status'], [string, string]> = {
    boarding: ['Посадка', 'bg-lavender-500/25 text-lavender-100 border-lavender-400/40'],
    on_time: ['Вовремя', 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30'],
    delayed: [f.delayMinutes ? `+${f.delayMinutes} мин` : 'Задержка', 'bg-amber-500/15 text-amber-200 border-amber-400/30'],
    scheduled: ['План', 'bg-navy-700/60 text-navy-200 border-navy-500/40'],
    cancelled: ['Отменён', 'bg-red-500/15 text-red-200 border-red-400/30'],
    departed: ['Вылетел', 'bg-navy-700/60 text-navy-300 border-navy-500/40'],
    arrived: ['Прибыл', 'bg-navy-700/60 text-navy-300 border-navy-500/40'],
  }
  const [label, cls] = map[f.status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap', cls, className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  )
}

function CodeBox({ code }: { code: string }) {
  return (
    <span className="w-9 h-9 shrink-0 rounded-lg bg-lavender-600/20 border border-lavender-500/25 flex items-center justify-center text-[12px] font-bold text-lavender-200">
      {code}
    </span>
  )
}

function gateText(f: Flight) {
  return f.gate && f.gate !== '—' ? f.gate : '—'
}

function NearestCard({ f, onOpen }: { f: Flight; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left rounded-3xl p-5 bg-gradient-to-br from-[#8467d6] to-[#6a4fc2] shadow-xl shadow-lavender-900/40 hover:brightness-105 transition"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white/80">Ближайший вылет</span>
        <StatusPill f={f} className="bg-white/20 border-white/25 text-white" />
      </div>
      <div className="flex items-baseline gap-2.5 flex-wrap mb-4">
        <span className="font-mono text-[26px] sm:text-[28px] font-bold text-white tracking-wide">{f.flightNumber}</span>
        <span className="text-[15px] text-white/90">
          {f.route.to.cityRu}
          <span className="hidden sm:inline text-white/70"> · {f.airline.nameRu}</span>
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          ['Стойки', f.checkInDesks || '—'],
          ['Выход', gateText(f)],
          ['Вылет', formatTime(departureTime(f))],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white/10 px-3 py-2.5">
            <div className="text-[11.5px] text-white/75">{label}</div>
            <div className="font-mono text-[17px] sm:text-[19px] font-bold text-white truncate">{value}</div>
          </div>
        ))}
      </div>
    </button>
  )
}

export function Home() {
  const navigate = useNavigate()
  const { unreadCount } = useNotifications()
  const { airlines, search, lastUpdated, refresh, isLive, loading, error, flights } = useFlights()
  const [query, setQuery] = useState('')
  const [airline, setAirline] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showDeparted, setShowDeparted] = useState(false)
  const [history, setHistory] = useState<string[]>(() => readHistory().slice(0, 4))

  const board = useMemo(() => search(query, airline), [search, query, airline])
  const active = useMemo(
    () => board.filter(isActiveFlight).sort((a, b) => departureTime(a).getTime() - departureTime(b).getTime()),
    [board],
  )
  const departed = useMemo(() => board.filter(isDepartedFlight), [board])
  const allActive = useMemo(() => flights.filter(isActiveFlight), [flights])

  const nearest = useMemo(() => {
    const now = Date.now()
    return (
      [...allActive]
        .filter((f) => f.status !== 'cancelled' && departureTime(f).getTime() >= now - 15 * 60000)
        .sort((a, b) => departureTime(a).getTime() - departureTime(b).getTime())[0] ?? null
    )
  }, [allActive])

  // Быстрые фильтры — 4 авиакомпании с наибольшим числом рейсов на табло
  const topAirlines = useMemo(() => {
    const count = new Map<string, number>()
    for (const f of allActive) count.set(f.airline.code, (count.get(f.airline.code) ?? 0) + 1)
    return airlines
      .filter((a) => count.has(a.code))
      .sort((a, b) => (count.get(b.code) ?? 0) - (count.get(a.code) ?? 0))
      .slice(0, 4)
  }, [airlines, allActive])

  const openFlight = (f: Flight) => {
    pushHistory(f.flightNumber)
    setHistory(readHistory().slice(0, 4))
    navigate(`/flights/${f.id}`)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim().toUpperCase().replace(/\s+/g, '')
    if (!q) return
    const exact = flights.find((f) => f.flightNumber.replace(/\s+/g, '') === q)
    if (exact) openFlight(exact)
  }

  const online = isLive && !error

  const filterChips = (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">
      {[{ code: null as string | null, label: 'Все' }, ...topAirlines.map((a) => ({ code: a.code, label: a.nameRu }))].map((c) => (
        <button
          key={c.code ?? 'all'}
          type="button"
          onClick={() => setAirline(c.code)}
          className={cn(
            'shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
            airline === c.code
              ? 'bg-lavender-600 border-lavender-500 text-white'
              : 'border-lavender-500/25 text-lavender-200 hover:border-lavender-400/50',
          )}
        >
          {c.label}
        </button>
      ))}
      <select
        value={airline && !topAirlines.some((a) => a.code === airline) ? airline : ''}
        onChange={(e) => setAirline(e.target.value || null)}
        className="shrink-0 rounded-full border border-lavender-500/25 bg-transparent px-3 py-1.5 text-[13px] text-lavender-200 focus:outline-none focus:border-lavender-400"
        aria-label="Все авиакомпании"
      >
        <option value="" className="bg-[#2a2a32]">
          Все авиакомпании
        </option>
        {airlines.map((a) => (
          <option key={a.code} value={a.code} className="bg-[#2a2a32]">
            {a.code} · {a.nameRu}
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="min-h-dvh page-pad app-bg">
      <div className="page-wrap pt-[max(env(safe-area-inset-top),1rem)] md:pt-8 pb-6 space-y-5">
        {/* Шапка */}
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="md:hidden flex items-center gap-2.5 mb-4">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-lavender-500 to-lavender-700 flex items-center justify-center text-white text-[16px]">
                ✈
              </span>
              <span className="text-[17px] font-bold text-lavender-50">AeroDesk</span>
            </div>
            <h1 className="text-[26px] sm:text-[32px] font-bold tracking-tight text-lavender-50 leading-tight">Табло Пулково</h1>
            <div className="flex items-center gap-2 mt-1.5 text-[12.5px] text-navy-300 flex-wrap">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-semibold',
                  online ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300',
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', online ? 'bg-emerald-400' : 'bg-red-400')} />
                {online ? 'онлайн' : 'офлайн'}
              </span>
              <span>
                LED · {lastUpdated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} · {allActive.length} рейсов впереди
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 md:mt-1">
            <button
              type="button"
              onClick={() => navigate('/knowledge')}
              className="hidden md:flex w-11 h-11 items-center justify-center rounded-xl border border-lavender-500/30 bg-[#2a2a32] hover:border-lavender-400/60"
              aria-label="Справочник"
            >
              <BookOpen className="w-5 h-5 text-lavender-200" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="relative w-11 h-11 flex items-center justify-center rounded-xl border border-lavender-500/30 bg-[#2a2a32] hover:border-lavender-400/60"
              aria-label="Уведомления"
            >
              <Bell className="w-5 h-5 text-lavender-200" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-lavender-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={refresh}
              className="w-11 h-11 flex items-center justify-center rounded-xl border border-lavender-500/30 bg-[#2a2a32] hover:border-lavender-400/60"
              aria-label="Обновить табло"
            >
              <RefreshCw className={cn('w-5 h-5 text-lavender-200', loading && 'animate-spin')} />
            </button>
          </div>
        </header>

        {/* Поиск + ближайший вылет */}
        <div className="grid gap-4 lg:grid-cols-2">
          <form onSubmit={submit} className="rounded-3xl border border-lavender-500/20 bg-[#222228] p-4 sm:p-5">
            <p className="hidden md:block text-[14px] font-semibold text-lavender-100 mb-3">Введите рейс — стойки, выход и вылет</p>
            <div className="flex items-center gap-2 rounded-2xl border border-lavender-500/30 bg-[#1a1a1f] p-1.5 focus-within:border-lavender-400">
              <Search className="w-5 h-5 text-navy-400 ml-2 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
                placeholder="Номер рейса: SU1234, FV6122…"
                className="flex-1 min-w-0 bg-transparent py-2.5 text-[16px] font-semibold tracking-wide text-lavender-50 placeholder:font-normal placeholder:tracking-normal placeholder:text-navy-400 focus:outline-none"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
              />
              <button type="submit" className="shrink-0 rounded-xl bg-lavender-600 hover:bg-lavender-500 px-5 py-2.5 text-[15px] font-semibold text-white">
                Найти
              </button>
            </div>
            {history.length > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-[12px] text-navy-400">Недавние</span>
                {history.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setQuery(h)}
                    className="rounded-full bg-lavender-600/20 border border-lavender-500/30 px-3 py-1 font-mono text-[12.5px] font-semibold text-lavender-200 hover:bg-lavender-600/35"
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </form>

          {nearest && <NearestCard f={nearest} onOpen={() => openFlight(nearest)} />}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-[14px] text-red-200">
            Табло недоступно: {error}. Нажмите «обновить» чуть позже.
          </div>
        )}
        {loading && !flights.length && !error && (
          <div className="rounded-2xl border border-lavender-500/20 bg-[#222228] p-8 text-center text-[14px] text-navy-300">
            Загрузка табло Пулково…
          </div>
        )}

        {/* Табло */}
        <section className="md:rounded-3xl md:border md:border-lavender-500/20 md:bg-[#222228] md:p-5">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h2 className="flex items-center gap-2 text-[17px] font-semibold text-lavender-50">
              Ещё не вылетели
              <span className="rounded-full bg-lavender-600/25 px-2 py-0.5 text-[12px] font-semibold text-lavender-200">{active.length}</span>
            </h2>
            <div className="hidden md:block">{filterChips}</div>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="md:hidden inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-lavender-300"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Фильтр
            </button>
          </div>
          {showFilters && <div className="md:hidden mb-3">{filterChips}</div>}

          {/* Компьютер: таблица */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[12px] text-navy-400 bg-[#2a2a32]">
                  <th className="font-medium py-2.5 pl-3 rounded-l-xl">Рейс</th>
                  <th className="font-medium py-2.5">Направление</th>
                  <th className="font-medium py-2.5">Стойки</th>
                  <th className="font-medium py-2.5">Выход</th>
                  <th className="font-medium py-2.5">Вылет</th>
                  <th className="font-medium py-2.5 pr-3 text-right rounded-r-xl">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lavender-500/10">
                {active.map((f) => (
                  <tr key={f.id} onClick={() => openFlight(f)} className="cursor-pointer hover:bg-lavender-600/10 transition-colors">
                    <td className="py-3.5 pl-3">
                      <div className="flex items-center gap-3">
                        <CodeBox code={f.airline.code} />
                        <span className="font-mono text-[14.5px] font-bold text-lavender-50">{f.flightNumber}</span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <div className="text-[14.5px] font-semibold text-lavender-50">{f.route.to.cityRu}</div>
                      <div className="text-[12px] text-navy-400">{f.airline.nameRu}</div>
                    </td>
                    <td className="py-3.5">
                      <div className="font-mono text-[14px] font-semibold text-lavender-100">{f.checkInDesks || '—'}</div>
                      <div className="text-[12px] text-navy-400">{PHASE_NOTE[getCheckInPhase(f)]}</div>
                    </td>
                    <td className="py-3.5 font-mono text-[20px] font-bold text-lavender-300">{gateText(f)}</td>
                    <td className="py-3.5">
                      <div className="font-mono text-[16px] font-bold text-lavender-50">{formatTime(departureTime(f))}</div>
                      <div className="text-[12px] text-navy-400">{departureNote(f)}</div>
                    </td>
                    <td className="py-3.5 pr-3 text-right">
                      <StatusPill f={f} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Телефон: карточки */}
          <div className="md:hidden space-y-2.5">
            {active.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => openFlight(f)}
                className="w-full flex items-center gap-3 rounded-2xl border border-lavender-500/20 bg-[#222228] p-3 text-left active:scale-[0.99] transition"
              >
                <CodeBox code={f.airline.code} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="font-mono text-[15px] font-bold text-lavender-50">{f.flightNumber}</span>
                    <span className="text-[14px] text-lavender-100 truncate">{f.route.to.cityRu}</span>
                  </div>
                  <div className="text-[12.5px] text-navy-400 truncate">
                    Стойки {f.checkInDesks || '—'} · выход {gateText(f)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="font-mono text-[16px] font-bold text-lavender-50">{formatTime(departureTime(f))}</span>
                  <StatusPill f={f} className="text-[11px] px-2" />
                </div>
              </button>
            ))}
          </div>

          {!loading && active.length === 0 && (
            <p className="text-center text-[14px] text-navy-400 py-10">{query ? 'Рейс не найден' : 'Нет рейсов по фильтру'}</p>
          )}

          <p className="mt-4 text-[12px] text-navy-400">
            Особые: УМКА / PRM / PETC / WEAP — в карточке рейса и{' '}
            <button type="button" onClick={() => navigate('/knowledge')} className="text-lavender-300 underline underline-offset-2">
              справочнике
            </button>
          </p>
        </section>

        {departed.length > 0 && (
          <section>
            <button
              type="button"
              onClick={() => setShowDeparted((v) => !v)}
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-navy-300 hover:text-lavender-200"
            >
              Уже вылетели ({departed.length})
              <ChevronDown className={cn('w-4 h-4 transition-transform', showDeparted && 'rotate-180')} />
            </button>
            {showDeparted && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {departed.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => openFlight(f)}
                    className="flex items-center gap-3 rounded-xl border border-lavender-500/15 bg-[#202026] p-2.5 text-left opacity-80 hover:opacity-100"
                  >
                    <CodeBox code={f.airline.code} />
                    <span className="font-mono text-[14px] font-bold text-lavender-100">{f.flightNumber}</span>
                    <span className="text-[13px] text-navy-300 truncate flex-1">{f.route.to.cityRu}</span>
                    <span className="font-mono text-[13px] text-navy-300">{formatTime(departureTime(f))}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
