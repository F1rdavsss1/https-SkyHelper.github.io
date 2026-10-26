import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Search, X } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { AirlineAvatar, AirlineGuideView } from '../components/AirlineGuideView'
import { CELL_BR, guideDisplayName, parseGuide } from '../lib/airlineGuide'
import { parseDsl } from '../lib/opsDsl'
import { loadAirlineGuides, type AirlineGuide } from '../lib/guidesStore'
import { dslDocs, hubGroups } from '../data/ops/catalog'
import { loadFileDocs } from './OpsDocPage'
import {
  knowledgeSections,
  petcSteps,
  remarks,
  seatLegend,
  weapSteps,
  wheelchairCodes,
} from '../data/opsKnowledge'

/** Фрагмент текста вокруг первого совпадения: [до, совпадение, после] */
function matchSnippet(body: string, query: string): [string, string, string] | null {
  const text = body.split(CELL_BR).join(' ').split(' | ').join(' · ')
  const i = text.toLowerCase().indexOf(query.toLowerCase())
  if (i < 0) return null
  return [text.slice(Math.max(0, i - 50), i), text.slice(i, i + query.length), text.slice(i + query.length, i + query.length + 90)]
}

function SeatSwatch({
  color,
  border,
  mark,
}: {
  color: string
  border?: string
  mark?: 'orange-triangle'
}) {
  return (
    <div className="relative w-11 h-11 rounded-lg shrink-0" style={{ background: color, border: border ? `3px solid ${border}` : '1px solid rgba(255,255,255,0.15)' }}>
      {mark === 'orange-triangle' && (
        <span
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderBottom: '10px solid #f97316',
          }}
        />
      )}
    </div>
  )
}

function Checklist({ steps }: { steps: { id: string; textRu: string; detailRu?: string }[] }) {
  const [done, setDone] = useState<Set<string>>(new Set())
  return (
    <div className="space-y-2">
      {steps.map((s, i) => {
        const ok = done.has(s.id)
        return (
          <button
            key={s.id}
            type="button"
            onClick={() =>
              setDone((prev) => {
                const n = new Set(prev)
                if (n.has(s.id)) n.delete(s.id)
                else n.add(s.id)
                return n
              })
            }
            className={`w-full text-left rounded-xl border p-3 ${
              ok ? 'bg-green-500/10 border-green-500/30' : 'bg-[#1e1e24] border-lavender-500/20'
            }`}
          >
            <div className={`text-[14px] font-medium ${ok ? 'text-navy-400 line-through' : 'text-lavender-100'}`}>
              {i + 1}. {s.textRu}
            </div>
            {s.detailRu && (
              <div className={`text-[12px] mt-1 ${ok ? 'text-navy-500' : 'text-navy-300'}`}>{s.detailRu}</div>
            )}
          </button>
        )
      })}
    </div>
  )
}

type SearchHit = { key: string; icon: string; title: string; kind: string; to: string; snippet: [string, string, string] | null }

/** Плоский текст из формата opsDsl — для поиска и фрагментов */
function dslPlain(text: string) {
  return text.replace(/\*\*|==|<br>|^#+\s|^[!>]\s/gm, ' ').replace(/\|/g, ' · ')
}

function useGlobalSearch(query: string) {
  const [hits, setHits] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setHits([])
      return
    }
    let alive = true
    setLoading(true)
    const needle = q.toLowerCase()
    const enc = encodeURIComponent(q)
    Promise.all([loadAirlineGuides(), loadFileDocs()]).then(([guides, files]) => {
      if (!alive) return
      const out: SearchHit[] = []
      for (const d of dslDocs) {
        const plain = dslPlain(d.text)
        if (`${d.title} ${plain}`.toLowerCase().includes(needle)) {
          out.push({ key: d.id, icon: d.icon, title: d.title, kind: 'Справочник', to: `/knowledge/doc/${d.id}?q=${enc}`, snippet: matchSnippet(plain, q) })
        }
      }
      for (const f of files) {
        if (`${f.titleRu} ${f.bodyRu}`.toLowerCase().includes(needle)) {
          out.push({ key: f.id, icon: '📄', title: f.titleRu, kind: 'Документ', to: `/knowledge/doc/${f.id}?q=${enc}`, snippet: matchSnippet(f.bodyRu, q) })
        }
      }
      for (const g of guides.airlineGuides) {
        const body = g.dsl ? dslPlain(g.dsl) : g.bodyRu
        if (`${g.titleRu} ${g.airlineCode ?? ''} ${body}`.toLowerCase().includes(needle)) {
          out.push({ key: g.id, icon: '✈️', title: g.titleRu, kind: 'Памятка АК', to: `/knowledge/airlines/${g.id}?q=${enc}`, snippet: matchSnippet(body, q) })
        }
      }
      setHits(out)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [query])

  return { hits, loading }
}

export function KnowledgeHub() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const { hits, loading } = useGlobalSearch(q)
  const searching = q.trim().length >= 2

  return (
    <div className="min-h-dvh page-pad app-bg">
      <header className="sticky top-0 z-40 glass border-b border-lavender-500/25 safe-top">
        <div className="page-wrap py-3 sm:py-4">
          <h1 className="text-h1 text-lavender-200">Справочник агента</h1>
          <p className="text-[12px] text-navy-400 mt-1 mb-3">Памятки АК, посадка, Astra, ремарки, багаж, документы, телефоны</p>
          <div className="relative">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Искать везде: WCLB, неявка, 0GP, коляска, Nordwind…"
              className="pl-11 pr-10"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-navy-300"
                aria-label="Очистить"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="page-wrap py-4 sm:py-5 space-y-6">
        {searching ? (
          <section className="space-y-2">
            <p className="text-[12px] text-navy-400">{loading ? 'Ищу…' : `Найдено: ${hits.length}`}</p>
            {hits.map((h) => (
              <button
                key={h.kind + h.key}
                type="button"
                onClick={() => navigate(h.to)}
                className="w-full text-left rounded-2xl border border-lavender-500/25 bg-[#2a2a32] p-3.5 hover:border-lavender-400/50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[18px]">{h.icon}</span>
                  <span className="text-[15px] font-semibold text-lavender-100 flex-1 min-w-0 truncate">{h.title}</span>
                  <span className="text-[11px] text-navy-400 shrink-0">{h.kind}</span>
                </div>
                {h.snippet && (
                  <p className="text-[12.5px] text-navy-300 mt-1.5 leading-snug line-clamp-2">
                    …{h.snippet[0]}
                    <mark className="rounded px-0.5 bg-amber-300/80 text-navy-950">{h.snippet[1]}</mark>
                    {h.snippet[2]}…
                  </p>
                )}
              </button>
            ))}
            {!loading && !hits.length && <p className="text-center text-navy-400 py-10">Ничего не найдено</p>}
          </section>
        ) : (
          hubGroups.map((g) => (
            <section key={g.title}>
              <h2 className="text-[12px] font-semibold uppercase tracking-wider text-lavender-300 mb-2.5">{g.title}</h2>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((s) => (
                  <button
                    key={s.to}
                    type="button"
                    onClick={() => navigate(s.to)}
                    className="group flex gap-3 text-left rounded-2xl border border-lavender-500/25 bg-[#2a2a32] p-3.5 hover:border-lavender-400/50 active:scale-[0.99] transition"
                  >
                    <span className="w-10 h-10 shrink-0 rounded-xl bg-lavender-600/20 border border-lavender-500/25 flex items-center justify-center text-[20px]">
                      {s.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-lavender-100">{s.title}</span>
                      <span className="block text-[12.5px] text-navy-400 mt-0.5 leading-snug">{s.description}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-navy-500 group-hover:text-lavender-300 mt-1 shrink-0" />
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  )
}

export function KnowledgeSection() {
  const { sectionId, guideId } = useParams<{ sectionId: string; guideId?: string }>()
  const navigate = useNavigate()
  const section = knowledgeSections.find((s) => s.id === sectionId) 
  const [q, setQ] = useState('')
  const [guides, setGuides] = useState<AirlineGuide[]>([])
  const [images, setImages] = useState<string[]>([])
  const [loadingGuides, setLoadingGuides] = useState(false)

  useEffect(() => {
    if (sectionId !== 'airlines' && sectionId !== 'seats') return
    setLoadingGuides(true)
    loadAirlineGuides()
      .then((data) => {
        setGuides(data.airlineGuides)
        setImages(data.images)
      })
      .finally(() => setLoadingGuides(false))
  }, [sectionId])

  const filteredRemarks = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return remarks
    return remarks.filter(
      (r) =>
        r.code.toLowerCase().includes(query) ||
        r.titleRu.toLowerCase().includes(query) ||
        r.descriptionRu.toLowerCase().includes(query)
    )
  }, [q])

  const filteredAirlines = useMemo(() => {
    const query = q.trim().toLowerCase().replace(/\s+/g, '')
    if (!query) return guides
    return guides.filter(
      (g) =>
        g.titleRu.toLowerCase().includes(q.trim().toLowerCase()) ||
        (g.airlineCode || '').toLowerCase().includes(query) ||
        g.bodyRu.toLowerCase().includes(q.trim().toLowerCase())
    )
  }, [guides, q])

  const guideInfo = useMemo(
    () =>
      new Map(
        guides.map((g) => {
          const p = g.dsl ? { meta: g.meta ?? {}, sections: parseDsl(g.dsl) } : parseGuide(g.blocks ?? [])
          return [g.id, { date: p.meta.date, sections: p.sections.map((s) => s.title).filter((t) => t !== 'Общее') }]
        }),
      ),
    [guides],
  )

  const openGuide = guides.find((g) => g.id === guideId)
  const [params] = useSearchParams()

  if (!section) {
    return (
      <div className="min-h-dvh app-bg flex items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-h1 text-lavender-200 mb-3">Раздел не найден</h2>
          <Button onClick={() => navigate('/knowledge')}>К справочнику</Button>
        </div>
      </div>
    )
  }

  // Airline guide reader (inline, not PDF)
  if (sectionId === 'airlines' && openGuide) {
    return (
      <div className="min-h-dvh page-pad app-bg">
        <header className="sticky top-0 z-40 glass border-b border-lavender-500/25 safe-top">
          <div className="page-wrap py-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/knowledge/airlines')}
              className="touch-target flex items-center justify-center"
              aria-label="Назад"
            >
              <ArrowLeft className="w-5 h-5 text-lavender-200" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-[16px] font-semibold text-lavender-100 truncate">{openGuide.titleRu}</h1>
              <p className="text-[11px] text-navy-400 truncate">Открыто в приложении</p>
            </div>
          </div>
        </header>
        <main className="page-wrap py-4">
          <AirlineGuideView
            title={openGuide.titleRu}
            code={openGuide.airlineCode}
            blocks={openGuide.blocks}
            dsl={openGuide.dsl}
            meta={openGuide.meta}
            header={openGuide.header}
            sourceNote={openGuide.sourceNote}
            initialQuery={params.get('q') ?? ''}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh page-pad app-bg">
      <header className="sticky top-0 z-40 glass border-b border-lavender-500/25 safe-top">
        <div className="page-wrap py-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/knowledge')}
            className="touch-target flex items-center justify-center"
            aria-label="Назад"
          >
            <ArrowLeft className="w-5 h-5 text-lavender-200" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold text-lavender-100 truncate">
              {section.icon} {section.titleRu}
            </h1>
            <p className="text-[12px] text-navy-400 truncate">{section.descriptionRu}</p>
          </div>
        </div>
      </header>

      <main className="page-wrap py-4 sm:py-5 space-y-4">
        {sectionId === 'seats' && (
          <>
            <div className="space-y-2">
              {seatLegend.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 items-start rounded-2xl border border-lavender-500/25 bg-[#2a2a32] p-3.5"
                >
                  <SeatSwatch color={item.color} border={item.border} mark={item.mark} />
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold text-lavender-100">{item.titleRu}</div>
                    <div className="text-[13px] text-navy-300 mt-1 leading-snug">{item.descriptionRu}</div>
                  </div>
                </div>
              ))}
            </div>
            {images.length > 0 && (
              <section>
                <h2 className="text-h2 text-lavender-200 mb-3">Примеры с карты мест</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {images.map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt="Карта мест"
                      className="w-full rounded-2xl border border-lavender-500/25 bg-[#1e1e24] object-contain max-h-[420px]"
                      loading="lazy"
                    />
                  ))}
                </div>
              </section>
            )}
            {loadingGuides && <p className="text-[13px] text-navy-400">Загрузка примеров…</p>}
          </>
        )}

        {sectionId === 'remarks' && (
          <>
            <div className="relative">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value.toUpperCase())}
                placeholder="Код или название: PETC, UNMR…"
                className="pl-11"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
            </div>
            <div className="space-y-2">
              {filteredRemarks.map((r) => (
                <div key={r.code} className="rounded-2xl border border-lavender-500/25 bg-[#2a2a32] p-3.5">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[16px] font-bold text-lavender-200 tracking-wide">{r.code}</span>
                    <span className="text-[14px] font-semibold text-lavender-100">{r.titleRu}</span>
                  </div>
                  <p className="text-[13px] text-navy-300 mt-1.5 leading-snug">{r.descriptionRu}</p>
                </div>
              ))}
              {filteredRemarks.length === 0 && (
                <p className="text-center text-navy-400 py-10">Ничего не найдено</p>
              )}
            </div>
          </>
        )}

        {sectionId === 'wheelchair' && (
          <div className="space-y-2">
            {wheelchairCodes.map((w) => (
              <div key={w.code} className="rounded-2xl border border-lavender-500/25 bg-[#2a2a32] p-4">
                <div className="text-[17px] font-bold text-lavender-200">
                  {w.code}
                  {w.phoneticRu ? (
                    <span className="text-[14px] font-semibold text-lavender-300 ml-2">({w.phoneticRu})</span>
                  ) : null}
                </div>
                <p className="text-[14px] text-navy-300 mt-2 leading-snug">{w.descriptionRu}</p>
              </div>
            ))}
          </div>
        )}

        {sectionId === 'weap' && (
          <>
            <p className="text-[13px] text-lavender-200/90 bg-lavender-600/15 border border-lavender-500/25 rounded-xl px-3 py-2">
              Патроны бесплатно дополнительно к оружию. Бесплатный WEAP — только с документами о командировке и т.п.
            </p>
            <Checklist steps={weapSteps} />
          </>
        )}

        {sectionId === 'petc' && (
          <>
            <p className="text-[13px] text-lavender-200/90 bg-lavender-600/15 border border-lavender-500/25 rounded-xl px-3 py-2">
              Жёсткая переноска — всегда мерить габариты. Расадка: длинный корешок сначала = прямая; два коротких =
              обратная.
            </p>
            <Checklist steps={petcSteps} />
          </>
        )}

        {sectionId === 'airlines' && (
          <>
            <div className="relative">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="DP, SU, Pobeda, Uzbekistan…"
                className="pl-11"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
            </div>
            {loadingGuides && <p className="text-[13px] text-navy-400">Загрузка памяток…</p>}
            {!loadingGuides && guides.length > 0 && (
              <p className="text-[12px] text-navy-400">
                {q.trim() ? `Найдено: ${filteredAirlines.length} из ${guides.length}` : `${guides.length} памяток`}
              </p>
            )}
            <div className="grid gap-2.5 sm:grid-cols-2">
              {filteredAirlines.map((g) => {
                const info = guideInfo.get(g.id)
                const snippet = q.trim() ? matchSnippet(g.bodyRu, q.trim()) : null
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => navigate(`/knowledge/airlines/${g.id}`)}
                    className="group w-full text-left rounded-2xl border border-lavender-500/25 bg-[#2a2a32] p-3.5 hover:border-lavender-400/50 active:scale-[0.99] transition"
                  >
                    <div className="flex items-center gap-3">
                      <AirlineAvatar code={g.airlineCode} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[15px] font-semibold text-lavender-100 truncate">
                          {guideDisplayName(g.titleRu, g.airlineCode)}
                        </div>
                        <div className="text-[12px] text-navy-400 mt-0.5 truncate">
                          {[info?.date && `обн. ${info.date}`, info && `${info.sections.length} разделов`]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-navy-500 group-hover:text-lavender-300 shrink-0" />
                    </div>
                    {snippet ? (
                      <p className="text-[12.5px] text-navy-300 mt-2.5 leading-snug line-clamp-2">
                        …{snippet[0]}
                        <mark className="rounded px-0.5 bg-amber-300/80 text-navy-950">{snippet[1]}</mark>
                        {snippet[2]}…
                      </p>
                    ) : (
                      info &&
                      info.sections.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {info.sections.slice(0, 4).map((s) => (
                            <span
                              key={s}
                              className="rounded-full bg-navy-900/60 border border-lavender-500/15 px-2 py-0.5 text-[11px] text-navy-300"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )
                    )}
                  </button>
                )
              })}
              {!loadingGuides && filteredAirlines.length === 0 && (
                <p className="text-center text-navy-400 py-10">Памятки не найдены</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
