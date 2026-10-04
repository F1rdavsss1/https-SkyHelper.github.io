import { useNavigate } from 'react-router-dom'
import { FlightCard } from '../components/FlightCard'
import { useFlights } from '../context/FlightsContext'
import { useState } from 'react'

export function Flights() {
  const navigate = useNavigate()
  const { airlines, byAirline, lastUpdated, isLive, sourceLabel, loading, error } = useFlights()
  const [airline, setAirline] = useState<string | null>(null)
  const list = byAirline(airline)

  return (
    <div className="min-h-dvh page-pad app-bg">
      <header className="sticky top-0 z-40 glass border-b border-lavender-500/25 safe-top">
        <div className="page-wrap py-3 sm:py-4">
          <h1 className="text-h1 text-lavender-200">Рейсы</h1>
          <p className="text-[12px] sm:text-caption text-navy-400 mt-0.5 truncate">
            {sourceLabel}
            {isLive ? ' · live' : ''} · {list.length} ·{' '}
            {lastUpdated.toLocaleTimeString('ru-RU')}
            {loading ? ' · обновление…' : ''}
          </p>
          {error && <p className="text-[12px] text-red-300 mt-1">{error}</p>}
          <div className="chip-row mt-3">
            <button
              type="button"
              onClick={() => setAirline(null)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-[12px] sm:text-[13px] font-semibold border ${
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
                className={`shrink-0 px-3.5 py-2 rounded-xl text-[12px] sm:text-[13px] font-semibold border ${
                  airline === a.code
                    ? 'bg-lavender-600 text-white border-lavender-500'
                    : 'bg-[#2a2a32] text-lavender-200 border-lavender-500/30'
                }`}
              >
                {a.code}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="page-wrap py-4 sm:py-5">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((flight) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              onClick={() => navigate(`/flights/${flight.id}`)}
            />
          ))}
        </div>
        {list.length === 0 && (
          <div className="text-center py-14 rounded-2xl bg-[#2a2a32] border border-lavender-500/20 text-navy-400 text-[14px]">
            Нет рейсов с открытой регистрацией
          </div>
        )}
      </main>
    </div>
  )
}
