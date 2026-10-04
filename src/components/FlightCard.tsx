import type { Flight } from '../types'
import { StatusBadge } from './ui/StatusBadge'
import { formatTime } from '../lib/utils'
import { checkInLabel, getCheckInPhase } from '../context/FlightsContext'
import { Clock, DoorOpen, Ticket } from 'lucide-react'

interface FlightCardProps {
  flight: Flight
  onClick?: () => void
  highlight?: boolean
}

export function FlightCard({ flight, onClick, highlight }: FlightCardProps) {
  const phase = getCheckInPhase(flight)
  const depTime =
    flight.delayMinutes && flight.delayMinutes > 0
      ? formatTime(
          flight.actualDeparture ??
            new Date(flight.scheduledDeparture.getTime() + flight.delayMinutes * 60000)
        )
      : formatTime(flight.scheduledDeparture)

  const desksLong = String(flight.checkInDesks).length > 12

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full min-w-0 text-left rounded-2xl border p-3.5 sm:p-5 transition-all duration-200 active:scale-[0.99] ${
        highlight
          ? 'bg-lavender-600/25 border-lavender-400 shadow-lg shadow-lavender-900/30'
          : 'bg-[#2a2a32] border-lavender-500/30 hover:border-lavender-400/60'
      }`}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-lavender-600 text-white flex items-center justify-center text-[15px] sm:text-lg font-bold shrink-0">
            {flight.airline.code}
          </div>
          <div className="min-w-0">
            <div className="text-[16px] sm:text-[18px] font-bold text-lavender-200 tracking-wide truncate">
              {flight.flightNumber}
            </div>
            <div className="text-[12px] sm:text-[13px] text-navy-300 truncate">
              {flight.route.to.cityRu}
              <span className="text-navy-500"> · {flight.airline.nameRu}</span>
            </div>
          </div>
        </div>
        <StatusBadge status={flight.status} delayMinutes={flight.delayMinutes} compact />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-1">
        <div className="lavender-panel p-2.5 sm:p-3 col-span-2">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-semibold text-lavender-300 mb-1">
            <Ticket className="w-3.5 h-3.5 shrink-0" />
            Стойки регистрации
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div
              className={`ops-number font-bold text-white ${desksLong ? 'text-[18px] sm:text-[22px]' : 'ops-number-lg'}`}
            >
              {flight.checkInDesks}
            </div>
            <div
              className={`self-start sm:self-auto text-[11px] sm:text-[12px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap ${
                phase === 'open'
                  ? 'bg-green-500/20 text-green-300'
                  : phase === 'closing_soon'
                    ? 'bg-amber-500/20 text-amber-300'
                    : phase === 'closed'
                      ? 'bg-navy-600 text-navy-300'
                      : 'bg-lavender-500/20 text-lavender-200'
              }`}
            >
              {checkInLabel(phase)}
            </div>
          </div>
          <div className="text-[11px] sm:text-[12px] text-lavender-200/70 mt-2">
            {formatTime(flight.checkInStart)} → {formatTime(flight.checkInEnd)}
          </div>
        </div>

        <div className="lavender-panel p-2.5 sm:p-3 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-semibold text-lavender-300 mb-1">
            <DoorOpen className="w-3.5 h-3.5 shrink-0" />
            Выход
          </div>
          <div className="ops-number ops-number-lg truncate">{flight.gate}</div>
          <div className="text-[10px] sm:text-[11px] text-lavender-200/70 mt-1.5 truncate">
            Терм. {flight.route.from.terminal || '—'}
          </div>
        </div>

        <div className="lavender-panel p-2.5 sm:p-3 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-semibold text-lavender-300 mb-1">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            Вылет
          </div>
          <div className="ops-number ops-number-lg">{depTime}</div>
          <div className="text-[10px] sm:text-[11px] text-lavender-200/70 mt-1.5 truncate">
            {flight.delayMinutes
              ? `план ${formatTime(flight.scheduledDeparture)} · +${flight.delayMinutes}`
              : flight.boardingStart
                ? `посадка ${formatTime(flight.boardingStart)}`
                : 'по расписанию'}
          </div>
        </div>
      </div>

      {flight.specialPassengers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {flight.specialPassengers.map((sp, idx) => (
            <span
              key={idx}
              className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-amber-500/20 text-amber-200 border border-amber-500/30"
            >
              {sp.category === 'umka'
                ? 'УМКА'
                : sp.category === 'prm'
                  ? 'Коляска'
                  : sp.category === 'petc'
                    ? 'Животное'
                    : sp.category.toUpperCase()}{' '}
              ×{sp.count}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}
