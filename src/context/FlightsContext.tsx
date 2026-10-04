import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Airline, Flight } from '../types'

type ApiFlight = Omit<
  Flight,
  | 'scheduledDeparture'
  | 'actualDeparture'
  | 'scheduledArrival'
  | 'actualArrival'
  | 'checkInStart'
  | 'checkInEnd'
  | 'boardingStart'
  | 'boardingEnd'
> & {
  scheduledDeparture: string
  actualDeparture?: string
  scheduledArrival: string
  actualArrival?: string
  checkInStart: string
  checkInEnd: string
  boardingStart?: string
  boardingEnd?: string
  statusLabelRu?: string
  source?: string
}

type BoardResponse = {
  flights: ApiFlight[]
  airlines: Airline[]
  updatedAt: string
  live: boolean
  source?: string
  airport?: string
  error?: string
}

function hydrate(f: ApiFlight): Flight {
  return {
    ...f,
    airline: { ...f.airline },
    route: { from: { ...f.route.from }, to: { ...f.route.to } },
    scheduledDeparture: new Date(f.scheduledDeparture),
    actualDeparture: f.actualDeparture ? new Date(f.actualDeparture) : undefined,
    scheduledArrival: new Date(f.scheduledArrival),
    actualArrival: f.actualArrival ? new Date(f.actualArrival) : undefined,
    checkInStart: new Date(f.checkInStart),
    checkInEnd: new Date(f.checkInEnd),
    boardingStart: f.boardingStart ? new Date(f.boardingStart) : undefined,
    boardingEnd: f.boardingEnd ? new Date(f.boardingEnd) : undefined,
    specialPassengers: (f.specialPassengers ?? []).map((s) => ({ ...s })),
  }
}

/** Board for check-in agents: hide flights whose registration already closed */
function isCheckInRelevant(flight: Flight, now = new Date()): boolean {
  if (flight.status === 'departed' || flight.status === 'arrived' || flight.status === 'cancelled') {
    return false
  }
  return getCheckInPhase(flight, now) !== 'closed'
}

export type CheckInPhase = 'not_started' | 'open' | 'closing_soon' | 'closed'

export function getCheckInPhase(flight: Flight, now = new Date()): CheckInPhase {
  if (now < flight.checkInStart) return 'not_started'
  if (now > flight.checkInEnd) return 'closed'
  const msLeft = flight.checkInEnd.getTime() - now.getTime()
  if (msLeft < 20 * 60 * 1000) return 'closing_soon'
  return 'open'
}

export function checkInLabel(phase: CheckInPhase): string {
  switch (phase) {
    case 'not_started':
      return 'Ещё не началась'
    case 'open':
      return 'Регистрация открыта'
    case 'closing_soon':
      return 'Скоро закроется'
    case 'closed':
      return 'Регистрация закрыта'
  }
}

interface FlightsContextType {
  flights: Flight[]
  airlines: Airline[]
  lastUpdated: Date
  isLive: boolean
  loading: boolean
  error: string | null
  sourceLabel: string
  getById: (id: string) => Flight | undefined
  search: (query: string, airlineCode?: string | null) => Flight[]
  byAirline: (code: string | null) => Flight[]
  refresh: () => void
}

const FlightsContext = createContext<FlightsContextType | undefined>(undefined)

export function FlightsProvider({ children }: { children: ReactNode }) {
  const [flights, setFlights] = useState<Flight[]>([])
  const [airlines, setAirlines] = useState<Airline[]>([])
  const [lastUpdated, setLastUpdated] = useState(() => new Date())
  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sourceLabel, setSourceLabel] = useState('LED · Пулково')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/flights', { cache: 'no-store' })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string; error?: string }
        throw new Error(body.detail || body.error || `HTTP ${res.status}`)
      }
      const data = (await res.json()) as BoardResponse
      const live = (data.flights ?? []).map(hydrate).filter((f) => isCheckInRelevant(f))
      setFlights(live)
      setAirlines(data.airlines ?? [])
      setLastUpdated(data.updatedAt ? new Date(data.updatedAt) : new Date())
      setIsLive(Boolean(data.live))
      setSourceLabel(
        data.airport === 'LED'
          ? 'LED · Пулково · регистрация'
          : data.airport || data.source || 'LED · Пулково'
      )
    } catch (e) {
      setIsLive(false)
      setError(e instanceof Error ? e.message : 'Не удалось загрузить табло')
      setFlights([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const id = window.setInterval(() => void load(), 60_000)
    return () => window.clearInterval(id)
  }, [load])

  const refresh = useCallback(() => {
    void load()
  }, [load])

  const normalize = (q: string) => q.toLowerCase().replace(/[\s*]+/g, '')

  const search = useCallback(
    (query: string, airlineCode?: string | null) => {
      const q = normalize(query)
      let list = flights
      if (airlineCode) {
        if (airlineCode === 'SU') {
          list = list.filter((f) => f.airline.code === 'SU' || f.airline.code === 'FV')
        } else {
          list = list.filter((f) => f.airline.code === airlineCode)
        }
      }
      if (!q) return list

      return list.filter((f) => {
        const num = normalize(f.flightNumber)
        return (
          num.includes(q) ||
          num.startsWith(q) ||
          f.airline.code.toLowerCase() === q ||
          f.airline.nameRu.toLowerCase().includes(query.toLowerCase()) ||
          f.route.from.code.toLowerCase().includes(q) ||
          f.route.to.code.toLowerCase().includes(q) ||
          f.route.from.cityRu.toLowerCase().includes(query.toLowerCase()) ||
          f.route.to.cityRu.toLowerCase().includes(query.toLowerCase())
        )
      })
    },
    [flights]
  )

  const byAirline = useCallback(
    (code: string | null) => {
      if (!code) return flights
      if (code === 'SU') return flights.filter((f) => f.airline.code === 'SU' || f.airline.code === 'FV')
      return flights.filter((f) => f.airline.code === code)
    },
    [flights]
  )

  const getById = useCallback((id: string) => flights.find((f) => f.id === id), [flights])

  const value = useMemo(
    () => ({
      flights,
      airlines,
      lastUpdated,
      isLive,
      loading,
      error,
      sourceLabel,
      getById,
      search,
      byAirline,
      refresh,
    }),
    [flights, airlines, lastUpdated, isLive, loading, error, sourceLabel, getById, search, byAirline, refresh]
  )

  return <FlightsContext.Provider value={value}>{children}</FlightsContext.Provider>
}

export function useFlights() {
  const ctx = useContext(FlightsContext)
  if (!ctx) throw new Error('useFlights must be used within FlightsProvider')
  return ctx
}
