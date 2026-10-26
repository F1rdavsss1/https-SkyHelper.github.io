import type { GuideMeta, RawBlock } from './airlineGuide'
import { extraGuides } from '../data/ops/extraGuides'

export type AirlineGuide = {
  id: string
  titleRu: string
  airlineCode?: string | null
  bodyRu: string
  blocks?: RawBlock[]
  header?: string
  fileName?: string
  /** Памятка набрана вручную (скан / PDF) */
  dsl?: string
  meta?: GuideMeta
  sourceNote?: string
}

type GuidesPayload = {
  images: string[]
  airlineGuides: AirlineGuide[]
}

let cache: Promise<GuidesPayload> | null = null

/** Памятки АК: из Word/Excel (public/ops/airline-guides.json) + набранные вручную (extraGuides) */
export function loadAirlineGuides(): Promise<GuidesPayload> {
  cache ??= fetch('/ops/airline-guides.json', { cache: 'no-cache' })
    .then((r) => r.json() as Promise<GuidesPayload>)
    .then((data) => {
      const extra: AirlineGuide[] = extraGuides.map((g) => ({ ...g, bodyRu: g.dsl }))
      const all = [...(data.airlineGuides ?? []), ...extra].sort((a, b) =>
        a.titleRu.localeCompare(b.titleRu, 'ru', { sensitivity: 'base' }),
      )
      return { images: data.images ?? [], airlineGuides: all }
    })
    .catch(() => {
      cache = null
      return { images: [], airlineGuides: [] }
    })
  return cache
}
