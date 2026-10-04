/** Sheremetyevo (SVO) public timetable → AeroDesk flight DTO */

const SVO_TIMETABLE = 'https://www.svo.aero/bitrix/timetable/'

const STATUS_MAP = {
  100: 'scheduled',
  130: 'on_time',
  140: 'on_time',
  160: 'boarding',
  170: 'boarding',
  180: 'departed',
  190: 'departed',
  200: 'departed',
  220: 'arrived',
  230: 'cancelled',
}

function parseDate(value) {
  if (!value || value === '') return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function padFlightNumber(code, flt) {
  const n = String(flt ?? '').replace(/\s+/g, '')
  return `${code}${n}`
}

function airportFromMar(mar, terminal) {
  if (!mar || typeof mar !== 'object') {
    return {
      code: '???',
      name: 'Unknown',
      nameRu: 'Неизвестно',
      city: 'Unknown',
      cityRu: 'Неизвестно',
    }
  }
  return {
    code: mar.iata || mar.rus || '???',
    name: mar.airport || mar.description || mar.city_eng || 'Unknown',
    nameRu: mar.airport_rus || mar.description_r || mar.city || 'Неизвестно',
    city: mar.city_eng || mar.city || 'Unknown',
    cityRu: mar.city || mar.city_eng || 'Неизвестно',
    terminal: terminal || undefined,
  }
}

function mapStatus(raw) {
  const id = Number(raw?.status_id)
  let status = STATUS_MAP[id] || 'scheduled'
  const sked = parseDate(raw.t_st)
  const et = parseDate(raw.t_et)
  let delayMinutes = 0
  if (sked && et) {
    delayMinutes = Math.max(0, Math.round((et.getTime() - sked.getTime()) / 60000))
    if (delayMinutes >= 15 && status !== 'cancelled' && status !== 'departed' && status !== 'arrived') {
      status = 'delayed'
    }
  }
  // status_code 2 often marks delay nuance on SVO
  if (Number(raw.status_code) === 2 && status === 'on_time') status = 'delayed'
  return { status, delayMinutes }
}

function mapFlight(raw) {
  const co = raw.co || {}
  const code = String(co.code || 'XX').toUpperCase()
  const flightNumber = padFlightNumber(code, raw.flt)
  const sked = parseDate(raw.t_st) || parseDate(raw.dat) || new Date()
  const et = parseDate(raw.t_et)
  const at = parseDate(raw.t_at) || parseDate(raw.t_otpr)
  const wayMin = Number(raw.way_time) || 120
  const arrSked = parseDate(raw.t_st_mar) || new Date(sked.getTime() + wayMin * 60000)
  const chinStart = parseDate(raw.t_chin_start) || parseDate(raw.estimated_chin_start)
  const chinEnd = parseDate(raw.t_chin_finish) || parseDate(raw.estimated_chin_finish)
  const boardStart = parseDate(raw.t_boarding_start) || parseDate(raw.planed_board_start)
  const boardEnd = parseDate(raw.t_bording_finish) || parseDate(raw.planed_board_end)
  const { status, delayMinutes } = mapStatus(raw)

  const checkInStart =
    chinStart ||
    (() => {
      const d = new Date(sked)
      d.setHours(d.getHours() - 3)
      return d
    })()
  const checkInEnd =
    chinEnd ||
    (() => {
      const d = new Date(sked)
      d.setMinutes(d.getMinutes() - 40)
      return d
    })()

  const gate = raw.gate_id ? String(raw.gate_id) : '—'
  const desks = raw.chin_id && String(raw.chin_id).trim() ? String(raw.chin_id).trim() : '—'

  return {
    id: `svo-${raw.i_id}`,
    flightNumber,
    airline: {
      code,
      name: co.name || code,
      nameRu: co.name || code,
    },
    route: {
      from: airportFromMar(raw.mar1, raw.term ? String(raw.term) : undefined),
      to: airportFromMar(raw.mar2),
    },
    scheduledDeparture: sked.toISOString(),
    actualDeparture: at ? at.toISOString() : et && delayMinutes ? et.toISOString() : undefined,
    scheduledArrival: arrSked.toISOString(),
    actualArrival: status === 'arrived' && parseDate(raw.t_at_mar) ? parseDate(raw.t_at_mar).toISOString() : undefined,
    status,
    gate,
    checkInDesks: desks,
    checkInStart: checkInStart.toISOString(),
    checkInEnd: checkInEnd.toISOString(),
    boardingStart: boardStart ? boardStart.toISOString() : undefined,
    boardingEnd: boardEnd ? boardEnd.toISOString() : undefined,
    aircraftType: raw.aircraft_type_name || '—',
    aircraftRegistration: undefined,
    specialPassengers: [],
    delayMinutes,
    statusLabelRu: raw.vip_status_rus || undefined,
    source: 'svo',
    airport: 'SVO',
  }
}

async function fetchSvoDirection(direction, dateStart, dateEnd) {
  const url = new URL(SVO_TIMETABLE)
  url.searchParams.set('direction', direction)
  url.searchParams.set('dateStart', dateStart)
  url.searchParams.set('dateEnd', dateEnd)
  url.searchParams.set('perPage', '9999')
  url.searchParams.set('page', '0')
  url.searchParams.set('locale', 'ru')

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'AeroDesk/1.0 (+local; airport board proxy)',
      Accept: 'application/json',
    },
  })
  if (!res.ok) throw new Error(`SVO ${direction} HTTP ${res.status}`)
  const data = await res.json()
  const items = Array.isArray(data?.items) ? data.items : []
  return items.map(mapFlight).filter((f) => f.flightNumber && f.route.from.code !== '???')
}

export async function fetchSvoBoard({ hoursBack = 2, hoursAhead = 12 } = {}) {
  const now = new Date()
  const start = new Date(now.getTime() - hoursBack * 3600_000)
  const end = new Date(now.getTime() + hoursAhead * 3600_000)
  const fmt = (d) => {
    // SVO expects local-ish ISO without Z; their board uses +03 offsets in responses
    const pad = (n) => String(n).padStart(2, '0')
    // Use Moscow wall time for the query window
    const msk = new Date(d.getTime() + 3 * 3600_000)
    return `${msk.getUTCFullYear()}-${pad(msk.getUTCMonth() + 1)}-${pad(msk.getUTCDate())}T${pad(msk.getUTCHours())}:${pad(msk.getUTCMinutes())}:${pad(msk.getUTCSeconds())}`
  }

  const dateStart = fmt(start)
  const dateEnd = fmt(end)

  const [deps] = await Promise.all([fetchSvoDirection('departure', dateStart, dateEnd)])

  // Prefer departures for check-in agents; sort by scheduled time
  deps.sort((a, b) => new Date(a.scheduledDeparture) - new Date(b.scheduledDeparture))

  const airlinesMap = new Map()
  for (const f of deps) {
    if (!airlinesMap.has(f.airline.code)) airlinesMap.set(f.airline.code, f.airline)
  }

  return {
    flights: deps,
    airlines: [...airlinesMap.values()].sort((a, b) => a.code.localeCompare(b.code)),
    source: 'svo',
    airport: 'SVO',
    updatedAt: new Date().toISOString(),
    count: deps.length,
  }
}
