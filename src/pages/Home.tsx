import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlightCard } from '../components/FlightCard'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { isActiveFlight, isDepartedFlight, useFlights } from '../context/FlightsContext'
import { useNotifications } from '../context/NotificationsContext'
import { Search, Bell, RefreshCw, BookOpen } from 'lucide-react'
import { formatTime } from '../lib/utils'
import type { Flight } from '../types'

function FlightGrid({
  flights,
  exactId,
  onOpen,
}: {
  flights: Flight[]
  exactId?: string
  onOpen: (f: Flight) => void
}) {
  if (!flights.length) return null
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
      {flights.map((flight) => (
        <FlightCard
          key={flight.id}
          flight={flight}
          highlight={exactId === flight.id}
          onClick={() => onOpen(flight)}
        />
      ))}
    </div>
  )
}

export function Home() {
  const navigate = useNavigate()
  const { unreadCount } = useNotifications()
  const { airlines, search, lastUpdated, byAirline, refresh, isLive, loading, error, sourceLabel, flights } =
    useFlights()
  const [searchQuery, setSearchQuery] = useState('')
  const [airline, setAirline] = useState<string | null>(null)

  const results = useMemo(() => search(searchQuery, airline), [search, searchQuery, airline])

  const exact = useMemo(() => {
    const q = searchQuery.trim().toUpperCase().replace(/\s+/g, '')
    if (!q) return null
    return results.find((f) => f.flightNumber.replace(/\s+/g, '') === q) ?? null
  }, [searchQuery, results])

  const board = searchQuery.trim() ? results : byAirline(airline)
  const active = useMemo(() => board.filter(isActiveFlight), [board])
  const departed = useMemo(() => board.filter(isDepartedFlight), [board])

  const pushHistory = (q: string) => {
    try {
      const prev = JSON.parse(localStorage.getItem('aerodesk_search_history') || '[]') as string[]
      localStorage.setItem(
        'aerodesk_search_history',
        JSON.stringify([q, ...prev.filter((h) => h !== q)].slice(0, 12))
      )
    } catch {
      /* ignore */
    }
  }

  const quick = useMemo(() => {
    const openish = active.filter(
      (f) => f.status === 'on_time' || f.status === 'boarding' || f.status === 'delayed'
    )
    const pool = openish.length ? openish : active
    return pool.slice(0, 4).map((f) => f.flightNumber)
  }, [active])

  const openFlight = (flight: Flight) => {
    pushHistory(flight.flightNumber)
    navigate(`/flights/${flight.id}`)
  }

  return (
    <div className="min-h-dvh page-pad app-bg">
      <header className="sticky top-0 z-40 glass border-b border-lavender-500/25 safe-top">
        <div className="page-wrap py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-h1 text-lavender-200 md:hidden">AeroDesk</h1>
            <h1 className="text-h1 text-lavender-200 hidden md:block">Табло Пулково</h1>
            <p className="text-[12px] sm:text-caption text-navy-300 mt-0.5 truncate">
              {sourceLabel}
              {isLive ? ' · live' : ''}
              {' · '}
              {lastUpdated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              {' · '}
              {flights.length} рейсов
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/knowledge')}
              className="touch-target flex items-center justify-center rounded-xl bg-lavender-600/20 border border-lavender-500/40"
              aria-label="Справочник"
            >
              <BookOpen className="w-5 h-5 text-lavender-300" />
            </button>
            <button
              type="button"
              onClick={refresh}
              className="touch-target flex items-center justify-center rounded-xl bg-lavender-600/20 border border-lavender-500/40"
              aria-label="Обновить"
            >
              <RefreshCw className="w-5 h-5 text-lavender-300" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="relative touch-target flex items-center justify-center rounded-xl bg-lavender-600/20 border border-lavender-500/40"
              aria-label="Уведомления"
            >
              <Bell className="w-5 h-5 text-lavender-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-lavender-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="page-wrap py-4 sm:py-5 space-y-4 sm:space-y-5">
        <section className="rounded-2xl bg-[#2a2a32] border border-lavender-500/30 p-3 sm:p-4">
          <p className="text-[12px] sm:text-[13px] text-lavender-300 mb-2 font-medium">
            Введите рейс — стойки, выход и вылет
          </p>
          <div className="relative">
            <Input
              placeholder="SU1234, FV6122…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              className="pl-11 h-12 sm:h-14 text-[16px] sm:text-[18px] font-semibold tracking-wide border-lavender-500/40 bg-[#1e1e24] text-lavender-100 placeholder:text-navy-400 focus:ring-lavender-500"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-lavender-400" />
          </div>
          {quick.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {quick.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSearchQuery(s)
                    pushHistory(s)
                  }}
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-lavender-600/25 border border-lavender-500/40 text-[12px] sm:text-[13px] font-semibold text-lavender-200"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </section>

        {error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 sm:p-4 text-[13px] sm:text-[14px] text-red-200">
            Табло недоступно: {error}. Запустите API (`npm run api`) и нажмите обновить.
          </div>
        )}
        {loading && !flights.length && !error && (
          <div className="rounded-2xl border border-lavender-500/20 bg-[#2a2a32] p-8 text-center text-[14px] text-navy-300">
            Загрузка табло Пулково…
          </div>
        )}

        <section>
          <h2 className="text-[13px] sm:text-[14px] font-semibold text-lavender-300 mb-2">Авиакомпания</h2>
          <div className="chip-row">
            <button
              type="button"
              onClick={() => setAirline(null)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-[12px] sm:text-[13px] font-semibold border transition-colors ${
                airline === null
                  ? 'bg-lavender-600 text-white border-lavender-500'
                  : 'bg-[#2a2a32] text-lavender-200 border-lavender-500/30'
              }`}
            >
              Все
            </button>
            {airlines.slice(0, 12).map((a) => (
              <button
                key={a.code}
                type="button"
                onClick={() => setAirline(a.code === airline ? null : a.code)}
                className={`shrink-0 px-3.5 py-2 rounded-xl text-[12px] sm:text-[13px] font-semibold border transition-colors ${
                  airline === a.code
                    ? 'bg-lavender-600 text-white border-lavender-500'
                    : 'bg-[#2a2a32] text-lavender-200 border-lavender-500/30'
                }`}
              >
                <span className="sm:hidden">{a.code}</span>
                <span className="hidden sm:inline">
                  {a.code} · {a.nameRu}
                </span>
              </button>
            ))}
          </div>
        </section>

        {exact && (
          <div className="rounded-2xl border border-lavender-400 bg-lavender-600/20 p-3.5 sm:p-4 animate-in">
            <div className="text-[12px] sm:text-[13px] font-semibold text-lavender-300 mb-1">Найден рейс</div>
            <div className="text-[18px] sm:text-[20px] font-bold text-white mb-1">{exact.flightNumber}</div>
            <div className="text-[13px] sm:text-[14px] text-lavender-100 break-words">
              Стойки <b>{exact.checkInDesks}</b> · выход <b>{exact.gate}</b> · вылет{' '}
              <b>
                {exact.delayMinutes
                  ? formatTime(
                      exact.actualDeparture ??
                        new Date(exact.scheduledDeparture.getTime() + exact.delayMinutes * 60000)
                    )
                  : formatTime(exact.scheduledDeparture)}
              </b>
            </div>
            <Button className="mt-3 w-full sm:w-auto" onClick={() => openFlight(exact)}>
              Открыть карточку
            </Button>
          </div>
        )}

        {board.length === 0 && !loading ? (
          <div className="text-center py-12 sm:py-14 rounded-2xl bg-[#2a2a32] border border-lavender-500/20">
            <Search className="w-8 h-8 mx-auto text-lavender-400 mb-3" />
            <h3 className="text-[16px] font-semibold text-lavender-100 mb-1">Рейс не найден</h3>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => {
                setSearchQuery('')
                setAirline(null)
              }}
            >
              Сбросить
            </Button>
          </div>
        ) : (
          <>
            <section>
              <h2 className="text-h2 text-lavender-200 mb-3">
                Ещё не вылетели
                <span className="text-caption font-normal text-navy-400 ml-2">({active.length})</span>
              </h2>
              <FlightGrid flights={active} exactId={exact?.id} onOpen={openFlight} />
              {active.length === 0 && (
                <p className="text-[13px] text-navy-400 rounded-xl border border-lavender-500/20 bg-[#2a2a32] p-4">
                  Нет активных рейсов по фильтру
                </p>
              )}
            </section>

            <section>
              <h2 className="text-h2 text-lavender-200 mb-3">
                Уже вылетели
                <span className="text-caption font-normal text-navy-400 ml-2">({departed.length})</span>
              </h2>
              <FlightGrid flights={departed} exactId={exact?.id} onOpen={openFlight} />
              {departed.length === 0 && (
                <p className="text-[13px] text-navy-400 rounded-xl border border-lavender-500/20 bg-[#2a2a32] p-4">
                  Пока нет вылетевших в выборке
                </p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
