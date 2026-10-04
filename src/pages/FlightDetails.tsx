import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Button } from '../components/ui/Button'
import { formatTime, formatDate } from '../lib/utils'
import { checkInLabel, getCheckInPhase, useFlights } from '../context/FlightsContext'
import {
  ArrowLeft,
  Share2,
  DoorOpen,
  Ticket,
  Plane,
  CheckCircle2,
  Clock,
  Users,
} from 'lucide-react'
import { AgentCheckPanel } from '../components/AgentCheckPanel'

export function FlightDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getById, lastUpdated } = useFlights()
  const flight = getById(id || '')
  const [flash, setFlash] = useState(false)
  const [prevGate, setPrevGate] = useState<string | null>(null)
  const [prevDesks, setPrevDesks] = useState<string | null>(null)

  useEffect(() => {
    if (!flight) return
    setPrevGate((p) => {
      if (p && p !== flight.gate) setFlash(true)
      return flight.gate
    })
    setPrevDesks((p) => {
      if (p && p !== flight.checkInDesks) setFlash(true)
      return flight.checkInDesks
    })
    const t = window.setTimeout(() => setFlash(false), 1200)
    return () => window.clearTimeout(t)
  }, [flight?.gate, flight?.checkInDesks, flight?.delayMinutes, flight])

  if (!flight) {
    return (
      <div className="min-h-dvh app-bg flex items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-h1 text-lavender-200 mb-2">Рейс не найден</h2>
          <Button onClick={() => navigate('/')}>К поиску</Button>
        </div>
      </div>
    )
  }

  const phase = getCheckInPhase(flight)
  const depDisplay =
    flight.delayMinutes && flight.delayMinutes > 0
      ? formatTime(
          flight.actualDeparture ??
            new Date(flight.scheduledDeparture.getTime() + flight.delayMinutes * 60000)
        )
      : formatTime(flight.scheduledDeparture)

  const timeline = [
    { time: formatTime(flight.checkInStart), label: 'Регистрация открыта', done: true },
    {
      time: formatTime(flight.checkInEnd),
      label: 'Регистрация завершена',
      done: phase === 'closed' || ['boarding', 'departed', 'arrived'].includes(flight.status),
    },
    {
      time: flight.boardingStart ? formatTime(flight.boardingStart) : '--:--',
      label: 'Посадка начата',
      done: ['boarding', 'departed', 'arrived'].includes(flight.status),
    },
    {
      time: flight.boardingEnd ? formatTime(flight.boardingEnd) : '--:--',
      label: 'Посадка завершена',
      done: ['departed', 'arrived'].includes(flight.status),
    },
    {
      time: formatTime(flight.scheduledDeparture),
      label: 'Плановый вылет',
      done: ['departed', 'arrived'].includes(flight.status),
    },
    {
      time: depDisplay,
      label: flight.delayMinutes ? `Вылет с учётом задержки (+${flight.delayMinutes} мин)` : 'Вылет',
      done: ['departed', 'arrived'].includes(flight.status),
    },
  ]

  const handleShare = async () => {
    const text = [
      `${flight.flightNumber} ${flight.route.from.cityRu} → ${flight.route.to.cityRu}`,
      `Стойки: ${flight.checkInDesks} (${checkInLabel(phase)})`,
      `Выход: ${flight.gate}`,
      `Вылет: ${depDisplay}`,
      flight.boardingStart ? `Посадка: ${formatTime(flight.boardingStart)}` : null,
    ]
      .filter(Boolean)
      .join('\n')
    if (navigator.share) await navigator.share({ title: flight.flightNumber, text })
    else await navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-dvh app-bg pb-8 safe-bottom">
      <header className="sticky top-0 z-40 glass border-b border-lavender-500/25 safe-top">
        <div className="mx-auto max-w-3xl px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="touch-target flex items-center justify-center rounded-xl text-lavender-300 shrink-0"
            aria-label="Назад"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center min-w-0 flex-1 px-1">
            <div className="text-[16px] sm:text-[18px] font-bold text-lavender-200 truncate">
              {flight.flightNumber}
            </div>
            <div className="text-[11px] sm:text-[12px] text-navy-400 truncate">
              {formatDate(flight.scheduledDeparture)} · {formatTime(lastUpdated)}
            </div>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="touch-target flex items-center justify-center rounded-xl text-lavender-300 shrink-0"
            aria-label="Поделиться"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-3 sm:px-6 py-4 sm:py-5 space-y-3 animate-in">
        <div className="rounded-2xl bg-[#2a2a32] border border-lavender-500/30 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="text-center min-w-0 flex-1">
              <div className="text-[22px] sm:text-[28px] font-bold text-white leading-none">
                {flight.route.from.code}
              </div>
              <div className="text-[12px] sm:text-[13px] text-lavender-300 mt-1.5 truncate">
                {flight.route.from.cityRu}
              </div>
            </div>
            <div className="flex-1 px-2 sm:px-3 flex flex-col items-center min-w-[3rem]">
              <div className="w-full h-px bg-lavender-500/40 relative mb-2">
                <Plane className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-lavender-400 bg-[#2a2a32]" />
              </div>
              <div className="text-[11px] sm:text-[12px] text-navy-400 text-center truncate max-w-full">
                {flight.airline.nameRu}
              </div>
            </div>
            <div className="text-center min-w-0 flex-1">
              <div className="text-[22px] sm:text-[28px] font-bold text-white leading-none">
                {flight.route.to.code}
              </div>
              <div className="text-[12px] sm:text-[13px] text-lavender-300 mt-1.5 truncate">
                {flight.route.to.cityRu}
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <StatusBadge status={flight.status} delayMinutes={flight.delayMinutes} />
          </div>
        </div>

        <div className={`lavender-panel p-4 sm:p-5 ${flash ? 'gate-changed' : ''}`}>
          <div className="flex items-center gap-2 text-lavender-300 mb-3">
            <Ticket className="w-5 h-5 shrink-0" />
            <span className="text-[13px] sm:text-[14px] font-bold uppercase tracking-wide">Регистрация</span>
          </div>
          <div className="ops-number ops-number-xl">{flight.checkInDesks}</div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`text-[12px] sm:text-[13px] font-semibold px-3 py-1.5 rounded-lg ${
                phase === 'open'
                  ? 'bg-green-500/25 text-green-300'
                  : phase === 'closing_soon'
                    ? 'bg-amber-500/25 text-amber-300'
                    : phase === 'closed'
                      ? 'bg-navy-700 text-navy-300'
                      : 'bg-lavender-500/25 text-lavender-200'
              }`}
            >
              {checkInLabel(phase)}
            </span>
            <span className="text-[12px] sm:text-[13px] text-lavender-200/80">
              {formatTime(flight.checkInStart)} → {formatTime(flight.checkInEnd)}
            </span>
          </div>
          {prevDesks && prevDesks !== flight.checkInDesks && (
            <p className="mt-2 text-[13px] font-semibold text-amber-300">
              Стойки изменены: было {prevDesks}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className={`lavender-panel p-3 sm:p-4 min-w-0 ${flash ? 'gate-changed' : ''}`}>
            <div className="flex items-center gap-1.5 text-lavender-300 mb-2">
              <DoorOpen className="w-4 h-4 shrink-0" />
              <span className="text-[11px] sm:text-[12px] font-bold uppercase">Выход</span>
            </div>
            <div className="ops-number ops-number-xl truncate">{flight.gate}</div>
            <div className="text-[11px] sm:text-[12px] text-lavender-200/70 mt-2 truncate">
              Терминал {flight.route.from.terminal || '—'}
            </div>
            {prevGate && prevGate !== flight.gate && (
              <p className="mt-2 text-[12px] font-semibold text-amber-300">было {prevGate}</p>
            )}
          </div>

          <div className="lavender-panel p-3 sm:p-4 min-w-0">
            <div className="flex items-center gap-1.5 text-lavender-300 mb-2">
              <Clock className="w-4 h-4 shrink-0" />
              <span className="text-[11px] sm:text-[12px] font-bold uppercase">Вылет</span>
            </div>
            <div className="ops-number ops-number-xl">{depDisplay}</div>
            <div className="text-[11px] sm:text-[12px] text-lavender-200/70 mt-2 truncate">
              {flight.delayMinutes
                ? `план ${formatTime(flight.scheduledDeparture)} · +${flight.delayMinutes} мин`
                : 'по расписанию'}
            </div>
          </div>
        </div>

        {flight.boardingStart && (
          <div className="lavender-panel p-4 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-lavender-300 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-[12px] font-bold uppercase">Посадка</span>
              </div>
              <div className="text-[28px] font-bold text-white tabular-nums">
                {formatTime(flight.boardingStart)}
                {flight.boardingEnd ? ` → ${formatTime(flight.boardingEnd)}` : ''}
              </div>
            </div>
            {flight.status === 'boarding' && (
              <span className="text-[12px] font-bold px-3 py-1.5 rounded-lg bg-blue-500/25 text-blue-300">
                Идёт сейчас
              </span>
            )}
          </div>
        )}

        <div className="rounded-2xl bg-[#2a2a32] border border-lavender-500/30 p-4">
          <AgentCheckPanel onFlight={flight.specialPassengers} />
        </div>

        <div className="rounded-2xl bg-[#2a2a32] border border-lavender-500/30 p-5">
          <h3 className="text-[15px] font-bold text-lavender-200 mb-4">Расписание</h3>
          <div className="space-y-0">
            {timeline.map((item, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  {item.done ? (
                    <CheckCircle2 className="w-4 h-4 text-lavender-400 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-lavender-500/40 shrink-0" />
                  )}
                  {idx < timeline.length - 1 && (
                    <div className="w-px flex-1 min-h-6 bg-lavender-500/20 my-1" />
                  )}
                </div>
                <div className="pb-4 flex-1 flex gap-3">
                  <span className="w-12 text-[13px] font-semibold text-lavender-300 tabular-nums">
                    {item.time}
                  </span>
                  <span className={`text-[14px] ${item.done ? 'text-white' : 'text-navy-400'}`}>
                    {item.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {flight.specialPassengers.length > 0 && (
          <div className="rounded-2xl bg-[#2a2a32] border border-lavender-500/30 p-4">
            <h3 className="text-[15px] font-bold text-lavender-200 mb-3">На этом рейсе</h3>
            <div className="flex flex-wrap gap-2">
              {flight.specialPassengers.map((sp, idx) => (
                <span
                  key={idx}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[13px] font-semibold"
                >
                  {sp.category.toUpperCase()} — {sp.count}
                </span>
              ))}
            </div>
            <p className="text-[12px] text-navy-400 mt-2">
              Чеклист «как зачекать» — в блоке выше ↑
            </p>
          </div>
        )}

        <p className="text-center text-[12px] text-navy-500 pt-2">
          {flight.aircraftType}
          {flight.aircraftRegistration ? ` · ${flight.aircraftRegistration}` : ''}
        </p>
      </main>
    </div>
  )
}
