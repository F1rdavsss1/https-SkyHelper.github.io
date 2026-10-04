import type { Flight } from '../types'
import { Plane, Building2, MapPin } from 'lucide-react'

export type AutocompleteItem =
  | { kind: 'flight'; flight: Flight }
  | { kind: 'airline'; code: string; nameRu: string }
  | { kind: 'airport'; code: string; cityRu: string; nameRu: string }

interface AutocompleteProps {
  items: AutocompleteItem[]
  onSelect: (item: AutocompleteItem) => void
}

export function Autocomplete({ items, onSelect }: AutocompleteProps) {
  if (items.length === 0) return null

  return (
    <div className="mt-2 rounded-2xl border border-lavender-200 dark:border-navy-700 bg-white dark:bg-navy-800 shadow-lg overflow-hidden animate-in">
      {items.map((item, idx) => {
        if (item.kind === 'flight') {
          const f = item.flight
          return (
            <button
              key={`f-${f.id}`}
              type="button"
              onClick={() => onSelect(item)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-lavender-50 dark:hover:bg-navy-700/60 transition-colors border-b border-lavender-100 dark:border-navy-700 last:border-0"
            >
              <div className="w-10 h-10 rounded-xl bg-lavender-100 dark:bg-lavender-900/40 flex items-center justify-center">
                <Plane className="w-4 h-4 text-lavender-600 dark:text-lavender-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-navy-800 dark:text-navy-100">
                  {f.flightNumber}
                  <span className="font-normal text-navy-400 ml-2">
                    {f.route.from.cityRu} → {f.route.to.cityRu}
                  </span>
                </div>
                <div className="text-caption text-navy-400 truncate">
                  {f.airline.nameRu} · Gate {f.gate}
                </div>
              </div>
            </button>
          )
        }

        if (item.kind === 'airline') {
          return (
            <button
              key={`a-${item.code}-${idx}`}
              type="button"
              onClick={() => onSelect(item)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-lavender-50 dark:hover:bg-navy-700/60 transition-colors border-b border-lavender-100 dark:border-navy-700 last:border-0"
            >
              <div className="w-10 h-10 rounded-xl bg-lavender-100 dark:bg-lavender-900/40 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-lavender-600 dark:text-lavender-400" />
              </div>
              <div>
                <div className="text-[15px] font-semibold text-navy-800 dark:text-navy-100">
                  {item.code} — {item.nameRu}
                </div>
                <div className="text-caption text-navy-400">Авиакомпания</div>
              </div>
            </button>
          )
        }

        return (
          <button
            key={`ap-${item.code}-${idx}`}
            type="button"
            onClick={() => onSelect(item)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-lavender-50 dark:hover:bg-navy-700/60 transition-colors border-b border-lavender-100 dark:border-navy-700 last:border-0"
          >
            <div className="w-10 h-10 rounded-xl bg-lavender-100 dark:bg-lavender-900/40 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-lavender-600 dark:text-lavender-400" />
            </div>
            <div>
              <div className="text-[15px] font-semibold text-navy-800 dark:text-navy-100">
                {item.code} — {item.cityRu}
              </div>
              <div className="text-caption text-navy-400">{item.nameRu}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export function buildAutocomplete(query: string, flights: Flight[]): AutocompleteItem[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, '')
  if (!q) return []

  const items: AutocompleteItem[] = []

  const airlineMap = new Map<string, string>()
  for (const f of flights) {
    airlineMap.set(f.airline.code, f.airline.nameRu)
  }
  for (const [code, nameRu] of airlineMap) {
    if (code.toLowerCase().startsWith(q) || nameRu.toLowerCase().includes(q)) {
      items.push({ kind: 'airline', code, nameRu })
    }
  }

  for (const f of flights) {
    const num = f.flightNumber.toLowerCase()
    if (
      num.includes(q) ||
      f.route.from.code.toLowerCase().includes(q) ||
      f.route.to.code.toLowerCase().includes(q) ||
      f.route.from.cityRu.toLowerCase().includes(query.trim().toLowerCase()) ||
      f.route.to.cityRu.toLowerCase().includes(query.trim().toLowerCase())
    ) {
      items.push({ kind: 'flight', flight: f })
    }
  }

  // Airports from flights
  const seen = new Set<string>()
  for (const f of flights) {
    for (const ap of [f.route.from, f.route.to]) {
      if (seen.has(ap.code)) continue
      if (
        ap.code.toLowerCase().includes(q) ||
        ap.cityRu.toLowerCase().includes(query.trim().toLowerCase()) ||
        ap.nameRu.toLowerCase().includes(query.trim().toLowerCase())
      ) {
        seen.add(ap.code)
        items.push({
          kind: 'airport',
          code: ap.code,
          cityRu: ap.cityRu,
          nameRu: ap.nameRu,
        })
      }
    }
  }

  return items.slice(0, 8)
}
