import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import {
  knowledgeSections,
  petcSteps,
  remarks,
  seatLegend,
  weapSteps,
  wheelchairCodes,
} from '../data/opsKnowledge'

type AirlineGuide = {
  id: string
  titleRu: string
  airlineCode?: string | null
  bodyRu: string
  fileName?: string
}

type GuidesPayload = {
  images: string[]
  airlineGuides: AirlineGuide[]
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

export function KnowledgeHub() {
  const navigate = useNavigate()
  return (
    <div className="min-h-dvh page-pad app-bg">
      <header className="sticky top-0 z-40 glass border-b border-lavender-500/25 safe-top">
        <div className="page-wrap py-3 sm:py-4">
          <h1 className="text-h1 text-lavender-200">Справочник агента</h1>
          <p className="text-[12px] text-navy-400 mt-1">Места, ремарки, коляски, WEAP / PETC, памятки АК</p>
        </div>
      </header>
      <main className="page-wrap py-4 sm:py-5 grid gap-3 sm:grid-cols-2">
        {knowledgeSections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => navigate(`/knowledge/${s.id}`)}
            className="text-left rounded-2xl border border-lavender-500/30 bg-[#2a2a32] p-4 active:scale-[0.99] transition-transform"
          >
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-[16px] font-semibold text-lavender-100">{s.titleRu}</div>
            <div className="text-[13px] text-navy-400 mt-1">{s.descriptionRu}</div>
          </button>
        ))}
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
    fetch('/ops/airline-guides.json')
      .then((r) => r.json())
      .then((data: GuidesPayload) => {
        setGuides(data.airlineGuides ?? [])
        setImages(data.images ?? [])
      })
      .catch(() => {
        setGuides([])
        setImages([])
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

  const openGuide = guides.find((g) => g.id === guideId)

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
          <article className="rounded-2xl border border-lavender-500/25 bg-[#2a2a32] p-4 sm:p-5">
            <pre className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-lavender-100 font-sans">
              {openGuide.bodyRu || 'Текст памятки пуст'}
            </pre>
          </article>
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
            <div className="space-y-2">
              {filteredAirlines.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => navigate(`/knowledge/airlines/${g.id}`)}
                  className="w-full text-left rounded-2xl border border-lavender-500/25 bg-[#2a2a32] p-4 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2">
                    {g.airlineCode && (
                      <span className="px-2 py-1 rounded-lg bg-lavender-600/30 text-lavender-200 text-[12px] font-bold">
                        {g.airlineCode}
                      </span>
                    )}
                    <span className="text-[15px] font-semibold text-lavender-100 truncate">{g.titleRu}</span>
                  </div>
                  <p className="text-[12px] text-navy-400 mt-1">Открыть текст в приложении →</p>
                </button>
              ))}
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
