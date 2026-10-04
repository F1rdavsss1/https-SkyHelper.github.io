/** Pulkovo (LED) public board → AeroDesk flight DTO */

const LED_API = 'https://pulkovoairport.ru/api/'

const LED_AIRPORT = {
  code: 'LED',
  name: 'Pulkovo',
  nameRu: 'Пулково',
  city: 'Saint Petersburg',
  cityRu: 'Санкт-Петербург',
  terminal: '1',
}

/** OD_RFS_CODE → FlightStatus */
const RFS_MAP = {
  SKD: 'scheduled',
  DLY: 'delayed',
  XLD: 'cancelled',
  OFF: 'departed',
  OFB: 'departed',
  RFB: 'boarding',
  BRD: 'boarding',
  GTO: 'boarding',
  FIN: 'departed',
}

function parseDate(value) {
  if (value == null || value === '' || typeof value === 'object') return null
  // Pulkovo times are Moscow/St.Petersburg local without offset — treat as +03:00
  const raw = String(value).trim()
  const withTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)
    ? raw
    : raw.replace(/\.000$/, '') + '+03:00'
  const d = new Date(withTz)
  return Number.isNaN(d.getTime()) ? null : d
}

function statusText(value) {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') return ''
  return String(value)
}

function normalizeFlightNumber(raw) {
  return String(raw || '')
    .replace(/\s+/g, '')
    .toUpperCase()
}

function mapStatus(raw) {
  const rfs = String(raw.OD_RFS_CODE || '').toUpperCase()
  let status = RFS_MAP[rfs] || 'scheduled'
  const labelRu = statusText(raw.OD_STATUS_RU)
  const labelEn = statusText(raw.OD_STATUS_EN).toLowerCase()

  if (labelEn.includes('cancel') || labelRu.toLowerCase().includes('отмен')) status = 'cancelled'
  else if (labelEn.includes('board') || /посадк/i.test(labelRu)) status = 'boarding'
  else if (labelEn.includes('depart') || /отправлен|вылетел/i.test(labelRu)) status = 'departed'
  else if (labelEn.includes('delay') || /задерж/i.test(labelRu)) status = 'delayed'

  const std = parseDate(raw.OD_STD)
  const etd = parseDate(raw.OD_ETD)
  let delayMinutes = 0
  if (std && etd) {
    delayMinutes = Math.max(0, Math.round((etd.getTime() - std.getTime()) / 60000))
  }

  // Infer boarding from actual boarding window when still on ground
  const boardStart = parseDate(raw.OD_BOARDING_BEGIN_ACTUAL) || parseDate(raw.OD_BOARDING_BEGIN_PLAN)
  const boardEnd = parseDate(raw.OD_BOARDING_END_ACTUAL) || parseDate(raw.OD_BOARDING_END_PLAN)
  const now = Date.now()
  if (status === 'scheduled' || status === 'on_time' || status === 'delayed') {
    if (boardStart && boardStart.getTime() <= now && (!boardEnd || boardEnd.getTime() >= now - 5 * 60_000)) {
      if (status !== 'delayed') status = 'boarding'
    } else if (status === 'scheduled' && delayMinutes < 15) {
      // Check-in open → on_time for ops UX
      const chinStart = parseDate(raw.OD_COUNTER_BEGIN_ACTUAL) || parseDate(raw.OD_COUNTER_BEGIN_PLAN)
      const chinEnd = parseDate(raw.OD_COUNTER_END_ACTUAL) || parseDate(raw.OD_COUNTER_END_PLAN)
      if (chinStart && chinEnd && chinStart.getTime() <= now && now <= chinEnd.getTime()) {
        status = 'on_time'
      }
    }
  }

  if (status === 'delayed' && delayMinutes === 0 && std && etd) {
    delayMinutes = Math.max(delayMinutes, 15)
  }

  return { status, delayMinutes, labelRu: labelRu || undefined }
}

function destinationAirport(raw) {
  const code = raw.OD_RAP_CODE_DESTINATION || raw.OD_RAP_CODE_NEXT || '???'
  const cityEn = raw.OD_RAP_DESTINATION_NAME_EN || raw.OD_RAP_NEXT_NAME_EN || code
  const cityRu = raw.OD_RAP_DESTINATION_NAME_RU || raw.OD_RAP_NEXT_NAME_RU || cityEn
  return {
    code: String(code).toUpperCase(),
    name: cityEn,
    nameRu: cityRu,
    city: cityEn,
    cityRu,
  }
}

function mapFlight(raw) {
  const flightNumber = normalizeFlightNumber(raw.OD_FLIGHT_NUMBER)
  const code = String(raw.OD_RAL_CODE || flightNumber.slice(0, 2) || 'XX').toUpperCase()
  const std = parseDate(raw.OD_STD) || new Date()
  const etd = parseDate(raw.OD_ETD)
  const atd = parseDate(raw.OD_ATD) || parseDate(raw.OD_OFFBLOCK)
  const arrSked =
    parseDate(raw.OD_RAP_CODE_DESTINATION_STA) ||
    parseDate(raw.OD_RAP_CODE_NEXT_STA) ||
    new Date(std.getTime() + 2 * 3600_000)

  const chinStart =
    parseDate(raw.OD_COUNTER_BEGIN_ACTUAL) ||
    parseDate(raw.OD_COUNTER_BEGIN_PLAN) ||
    (() => {
      const d = new Date(std)
      d.setHours(d.getHours() - 2)
      return d
    })()
  const chinEnd =
    parseDate(raw.OD_COUNTER_END_ACTUAL) ||
    parseDate(raw.OD_COUNTER_END_PLAN) ||
    (() => {
      const d = new Date(std)
      d.setMinutes(d.getMinutes() - 40)
      return d
    })()

  const boardStart = parseDate(raw.OD_BOARDING_BEGIN_ACTUAL) || parseDate(raw.OD_BOARDING_BEGIN_PLAN)
  const boardEnd = parseDate(raw.OD_BOARDING_END_ACTUAL) || parseDate(raw.OD_BOARDING_END_PLAN)
  const { status, delayMinutes, labelRu } = mapStatus(raw)

  const terminal = raw.OD_RTRM_CODE ? String(raw.OD_RTRM_CODE) : '1'
  const from = { ...LED_AIRPORT, terminal }

  const desks = raw.OD_COUNTERS && String(raw.OD_COUNTERS).trim() ? String(raw.OD_COUNTERS).trim() : '—'
  const gate = raw.OD_GATES && String(raw.OD_GATES).trim() ? String(raw.OD_GATES).trim() : '—'

  return {
    id: `led-${raw.OD_ID}`,
    flightNumber,
    airline: {
      code,
      name: raw.OD_RAL_NAME_EN || code,
      nameRu: raw.OD_RAL_NAME_RUS || raw.OD_RAL_NAME_EN || code,
    },
    route: {
      from,
      to: destinationAirport(raw),
    },
    scheduledDeparture: std.toISOString(),
    actualDeparture: atd ? atd.toISOString() : undefined,
    scheduledArrival: arrSked.toISOString(),
    status,
    gate,
    checkInDesks: desks,
    checkInStart: chinStart.toISOString(),
    checkInEnd: chinEnd.toISOString(),
    boardingStart: boardStart ? boardStart.toISOString() : undefined,
    boardingEnd: boardEnd ? boardEnd.toISOString() : undefined,
    aircraftType: raw.OD_RACT_CODE || raw.OD_RACT_ICAO_CODE || '—',
    aircraftRegistration: raw.OD_RAC_CODE || undefined,
    specialPassengers: [],
    delayMinutes,
    statusLabelRu: labelRu,
    codeshare: raw.OD_FLIGHT_NUMBER_K1
      ? {
          flightNumber: normalizeFlightNumber(raw.OD_FLIGHT_NUMBER_K1),
          airlineCode: raw.OD_RAL_CODE_K1,
          airlineNameRu: raw.OD_RAL_NAME_RUS_K1,
        }
      : undefined,
    source: 'pulkovo',
    airport: 'LED',
  }
}

export async function fetchLedBoard({ when = '0' } = {}) {
  const url = new URL(LED_API)
  url.searchParams.set('type', 'departure')
  url.searchParams.set('when', String(when))

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: 'https://pulkovoairport.ru/passengers/departure/',
      Origin: 'https://pulkovoairport.ru',
    },
  })
  if (!res.ok) throw new Error(`LED HTTP ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error('LED board: unexpected payload')

  const flights = data.map(mapFlight).filter((f) => f.flightNumber && f.route.to.code !== '???')

  // Full LED day board: keep all statuses (active + departed + cancelled)
  const rank = (f) => {
    if (f.status === 'boarding') return 0
    if (f.status === 'delayed') return 1
    if (f.status === 'on_time' || f.status === 'scheduled') return 2
    if (f.status === 'cancelled') return 3
    return 4 // departed / arrived
  }

  flights.sort((a, b) => {
    const ra = rank(a)
    const rb = rank(b)
    if (ra !== rb) return ra - rb
    return new Date(a.scheduledDeparture) - new Date(b.scheduledDeparture)
  })

  const airlinesMap = new Map()
  for (const f of flights) {
    if (!airlinesMap.has(f.airline.code)) airlinesMap.set(f.airline.code, f.airline)
  }

  return {
    flights,
    airlines: [...airlinesMap.values()].sort((a, b) => a.code.localeCompare(b.code)),
    source: 'pulkovo',
    airport: 'LED',
    updatedAt: new Date().toISOString(),
    count: flights.length,
  }
}
