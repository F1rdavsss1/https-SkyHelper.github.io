import { useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, ChevronDown, FileText, Phone, Search, X } from 'lucide-react'
import { Input } from './ui/Input'
import { cn } from '../lib/utils'
import {
  CELL_BR,
  PHONE_RE,
  SSR_CODES,
  airlineHue,
  guideDisplayName,
  parseGuide,
  phoneHref,
  type GuideBlock,
  type GuideSection,
} from '../lib/airlineGuide'

export function AirlineAvatar({ code, size = 'md' }: { code?: string | null; size?: 'md' | 'lg' }) {
  const hue = airlineHue(code)
  return (
    <div
      className={cn(
        'shrink-0 rounded-xl flex items-center justify-center font-bold tracking-wide text-white',
        size === 'lg' ? 'w-14 h-14 text-[18px]' : 'w-11 h-11 text-[14px]',
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 55% 48%), hsl(${(hue + 40) % 360} 60% 34%))`,
        boxShadow: `0 4px 14px hsl(${hue} 60% 30% / 0.35)`,
      }}
    >
      {code || '✈'}
    </div>
  )
}

const SECTION_ICONS: [RegExp, string][] = [
  [/регистрац/i, '🧾'],
  [/посадк/i, '🚪'],
  [/багаж|кладь|вес/i, '🧳'],
  [/особенност|важн/i, '⭐'],
  [/вопрос/i, '❓'],
  [/petc|avih|животн/i, '🐾'],
  [/носилк|wch|коляс/i, '♿'],
  [/автобус/i, '🚌'],
  [/бесплатн|оплат|тариф|услуг/i, '💳'],
  [/гражданств|документ|паспорт/i, '🛂'],
]

function sectionIcon(title: string): string {
  return SECTION_ICONS.find(([re]) => re.test(title))?.[1] ?? '📌'
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Текст с кликабельными телефонами, бейджами SSR-кодов и подсветкой поиска */
function Rich({ text, query }: { text: string; query: string }) {
  const lines = text.split(CELL_BR)
  const q = query.trim()
  const re = new RegExp(
    [PHONE_RE.source, `\\b(?:${[...SSR_CODES].join('|')})\\b`, q && escapeRe(q)].filter(Boolean).join('|'),
    'gi',
  )

  return (
    <>
      {lines.map((line, li) => {
        const out: ReactNode[] = []
        let last = 0
        for (const m of line.matchAll(re)) {
          const s = m[0]
          const i = m.index ?? 0
          if (i > last) out.push(line.slice(last, i))
          if (q && s.toLowerCase() === q.toLowerCase()) {
            out.push(
              <mark key={i} className="rounded px-0.5 bg-amber-300/80 text-navy-950">
                {s}
              </mark>,
            )
          } else if (/^\+|^[78]/.test(s.trim()) && s.replace(/\D/g, '').length >= 10) {
            out.push(
              <a
                key={i}
                href={phoneHref(s)}
                className="inline-flex items-center gap-1 text-lavender-300 underline decoration-lavender-500/50 underline-offset-2 whitespace-nowrap"
              >
                <Phone className="w-3.5 h-3.5" />
                {s.trim()}
              </a>,
            )
          } else if (SSR_CODES.has(s)) {
            out.push(
              <span
                key={i}
                className="inline-block rounded-md px-1.5 py-px mx-px text-[0.85em] font-bold tracking-wide bg-lavender-600/25 text-lavender-200 border border-lavender-500/30"
              >
                {s}
              </span>,
            )
          } else {
            out.push(s)
          }
          last = i + s.length
        }
        if (last < line.length) out.push(line.slice(last))
        return (
          <span key={li} className="block">
            {out}
          </span>
        )
      })}
    </>
  )
}

function Block({ block, query }: { block: GuideBlock; query: string }) {
  switch (block.kind) {
    case 'text':
      return (
        <p className="text-[14.5px] leading-relaxed text-lavender-100/90">
          <Rich text={block.text} query={query} />
        </p>
      )
    case 'bullet':
      return (
        <div className="flex gap-2.5 text-[14.5px] leading-relaxed text-lavender-100/90">
          <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-lavender-400 shrink-0" />
          <div className="min-w-0">
            <Rich text={block.text} query={query} />
          </div>
        </div>
      )
    case 'warning':
      return (
        <div className="flex gap-3 rounded-xl border border-amber-400/35 bg-amber-400/10 px-3.5 py-3">
          <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          <div className="text-[14px] leading-relaxed text-amber-50 font-medium min-w-0">
            <Rich text={block.text} query={query} />
          </div>
        </div>
      )
    case 'pairs':
      return (
        <dl className="rounded-xl border border-lavender-500/20 divide-y divide-lavender-500/15 overflow-hidden">
          {block.rows.map((r, i) => {
            const isCode = SSR_CODES.has(r.key) || /^[A-Z]{2,6}$/.test(r.key)
            return (
              <div key={i} className="grid sm:grid-cols-[minmax(110px,30%)_1fr] gap-x-4 gap-y-1 px-3.5 py-3 bg-navy-900/40">
                {r.key && (
                  <dt>
                    {isCode ? (
                      <span className="inline-block rounded-lg px-2 py-0.5 text-[13px] font-bold tracking-wide bg-lavender-600/30 text-lavender-100 border border-lavender-500/35">
                        {r.key}
                      </span>
                    ) : (
                      <span className="text-[13px] font-semibold text-lavender-300">
                        <Rich text={r.key} query={query} />
                      </span>
                    )}
                  </dt>
                )}
                <dd className={cn('text-[14px] leading-relaxed text-lavender-100/90 min-w-0', !r.key && 'sm:col-span-2')}>
                  <Rich text={r.value} query={query} />
                </dd>
              </div>
            )
          })}
        </dl>
      )
    case 'table': {
      const [head, ...rest] = block.rows
      const headLike = head[0] === '' || head.every((c) => c.length <= 30)
      const body = headLike ? rest : block.rows
      return (
        <div className="-mx-1 overflow-x-auto rounded-xl border border-lavender-500/20">
          <table className="w-full text-[13.5px] border-collapse">
            {headLike && (
              <thead>
                <tr className="bg-lavender-600/20">
                  {head.map((c, i) => (
                    <th key={i} className="px-3 py-2.5 text-left font-semibold text-lavender-200 align-bottom min-w-[100px]">
                      <Rich text={c} query={query} />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri} className="border-t border-lavender-500/15 odd:bg-navy-900/40">
                  {row.map((c, ci) => (
                    <td
                      key={ci}
                      className={cn(
                        'px-3 py-2.5 align-top text-lavender-100/90 min-w-[100px]',
                        ci === 0 && 'font-semibold text-lavender-200',
                      )}
                    >
                      <Rich text={c} query={query} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
  }
}

function blockText(b: GuideBlock): string {
  if (b.kind === 'pairs') return b.rows.map((r) => `${r.key} ${r.value}`).join(' ')
  if (b.kind === 'table') return b.rows.flat().join(' ')
  return b.text
}

function countMatches(s: GuideSection, q: string): number {
  const needle = q.toLowerCase()
  let n = s.title.toLowerCase().split(needle).length - 1
  for (const b of s.blocks) n += blockText(b).toLowerCase().split(needle).length - 1
  return n
}

function FactChip({ text }: { text: string }) {
  const idx = text.indexOf(':')
  const label = idx > 0 && idx < 28 ? text.slice(0, idx).trim() : ''
  const value = label ? text.slice(idx + 1).trim() : text
  if (!value) return null
  return (
    <div className="rounded-xl bg-navy-900/50 border border-lavender-500/20 px-3 py-2 min-w-0">
      {label && <div className="text-[10.5px] uppercase tracking-wider text-navy-400 mb-0.5">{label}</div>}
      <div className="text-[13.5px] font-medium text-lavender-100 break-words">
        <Rich text={value} query="" />
      </div>
    </div>
  )
}

export function AirlineGuideView({
  title,
  code,
  body,
}: {
  title: string
  code?: string | null
  body: string
}) {
  const guide = useMemo(() => parseGuide(body), [body])
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const q = query.trim()
  const matches = useMemo(
    () => (q.length >= 2 ? guide.sections.map((s) => countMatches(s, q)) : null),
    [guide, q],
  )
  const total = matches?.reduce((a, b) => a + b, 0) ?? 0
  const visible = guide.sections.filter((_, i) => !matches || matches[i] > 0)
  const minutes = Math.max(1, Math.round(body.length / 1200))

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const jump = (id: string) => {
    setCollapsed((prev) => {
      const n = new Set(prev)
      n.delete(id)
      return n
    })
    document.getElementById(`guide-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (!guide.sections.length && !guide.facts.length) {
    return <p className="text-center text-navy-400 py-10">Текст памятки пуст</p>
  }

  return (
    <div className="space-y-4">
      <section
        className="rounded-2xl border border-lavender-500/30 p-4 sm:p-5"
        style={{
          background: `linear-gradient(140deg, hsl(${airlineHue(code)} 45% 30% / 0.35), #2a2a32 65%)`,
        }}
      >
        <div className="flex items-center gap-3.5">
          <AirlineAvatar code={code} size="lg" />
          <div className="min-w-0">
            <h2 className="text-[20px] sm:text-[22px] font-bold text-lavender-50 leading-tight">
              {guideDisplayName(title, code)}
            </h2>
            <p className="text-[12.5px] text-navy-300 mt-1">
              {[guide.meta.date && `Обновлено ${guide.meta.date}`, guide.meta.author, `~${minutes} мин чтения`]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>

        {guide.facts.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {guide.facts.flat().map((f, i) => (
              <FactChip key={i} text={f} />
            ))}
          </div>
        )}
      </section>

      <div className="sticky top-[60px] z-30 -mx-1 px-1 py-2 app-bg space-y-2">
        <div className="relative">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти в памятке: PETC, коляска, аварийный ряд…"
            className="pl-11 pr-24"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
          {query && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <span className="text-[12px] text-navy-300">{q.length >= 2 ? total : ''}</span>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-navy-300 hover:text-lavender-200"
                aria-label="Очистить поиск"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {guide.sections.length > 1 && (
          <nav className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {visible.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => jump(s.id)}
                className="shrink-0 rounded-full border border-lavender-500/30 bg-[#2a2a32] px-3 py-1.5 text-[12.5px] text-lavender-200 whitespace-nowrap active:scale-95 transition-transform"
              >
                {sectionIcon(s.title)} {s.title}
              </button>
            ))}
          </nav>
        )}
      </div>

      {matches && total === 0 && <p className="text-center text-navy-400 py-8">В памятке ничего не найдено</p>}

      {visible.map((s) => {
        const open = !collapsed.has(s.id) || !!matches
        return (
          <section
            key={s.id}
            id={`guide-${s.id}`}
            className="scroll-mt-[150px] rounded-2xl border border-lavender-500/25 bg-[#2a2a32] overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggle(s.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
            >
              <span className="text-[20px] leading-none">{sectionIcon(s.title)}</span>
              <h3 className="flex-1 text-[16px] font-semibold text-lavender-100">{s.title}</h3>
              <ChevronDown className={cn('w-5 h-5 text-navy-400 transition-transform', open && 'rotate-180')} />
            </button>
            {open && (
              <div className="px-4 pb-4 space-y-3">
                {s.blocks.map((b, i) => (
                  <Block key={i} block={b} query={q.length >= 2 ? q : ''} />
                ))}
              </div>
            )}
          </section>
        )
      })}

      {guide.meta.document && (
        <footer className="flex gap-2.5 rounded-xl border border-lavender-500/15 px-3.5 py-3 text-[12px] text-navy-400">
          <FileText className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Источник: {guide.meta.document}</span>
        </footer>
      )}
    </div>
  )
}
