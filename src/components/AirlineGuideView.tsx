import { useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, Check, ChevronDown, Copy, FileText, Phone, Search, X } from 'lucide-react'
import { Input } from './ui/Input'
import { cn } from '../lib/utils'
import {
  CELL_BR,
  PHONE_RE,
  SERVICE_CODE_RE,
  SSR_CODES,
  airlineHue,
  guideBlockText,
  guideDisplayName,
  parseGuide,
  phoneHref,
  toLatinCode,
  type Cell,
  type GuideBlock,
  type GuideSection,
  type RawBlock,
  type Run,
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

const SSR_RE = new RegExp(`(?<![0-9A-Za-z])(?:${[...SSR_CODES].join('|')})(?![0-9A-Za-z])`)
// Общий regex ниже без учёта регистра — коды проверяем ещё раз строго (только заглавные)
const SERVICE_CODE_EXACT = new RegExp(`^${SERVICE_CODE_RE.source}$`)

/** Код услуги: моноширинный чип, по нажатию копируется латиницей */
function ServiceCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const latin = toLatinCode(code)
  const wasCyrillic = latin !== code
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        navigator.clipboard?.writeText(latin).then(
          () => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1200)
          },
          () => {},
        )
      }}
      title={
        wasCyrillic
          ? `Код ${latin} — в памятке набран кириллицей. Нажмите, чтобы скопировать латиницей`
          : `Код ${latin} — нажмите, чтобы скопировать`
      }
      className="inline-flex items-center gap-1 align-baseline rounded-md px-1.5 py-px mx-px font-mono text-[0.9em] font-bold tracking-wider bg-emerald-400/15 text-emerald-200 border border-emerald-400/40 hover:bg-emerald-400/25"
    >
      {latin}
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 opacity-50" />}
    </button>
  )
}

/** Текст с телефонами, кодами услуг, SSR-бейджами и подсветкой поиска */
function Tokens({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  // Поиск первым, чтобы найденное слово подсвечивалось даже внутри кода; «(?!)» — пустая группа
  const parts = [q ? escapeRe(q) : '(?!)', PHONE_RE.source, SERVICE_CODE_RE.source, SSR_RE.source]
  const re = new RegExp(parts.map((p) => `(${p})`).join('|'), 'gi')

  const out: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(re)) {
    const s = m[0]
    const i = m.index ?? 0
    if (i > last) out.push(text.slice(last, i))
    if (m[1]) {
      out.push(
        <mark key={i} className="rounded px-0.5 bg-amber-300/80 text-navy-950">
          {s}
        </mark>,
      )
    } else if (m[2] && /^\+|^[78]/.test(s.trim()) && s.replace(/\D/g, '').length >= 10) {
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
    } else if (m[3] && SERVICE_CODE_EXACT.test(s)) {
      out.push(<ServiceCode key={i} code={s} />)
    } else if (m[4] && SSR_CODES.has(s)) {
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
  if (last < text.length) out.push(text.slice(last))
  return <>{out}</>
}

/** Текст абзаца с разметкой из Word: жирный, маркер, красный, зачёркнутый */
function Runs({ runs, query }: { runs: Run[]; query: string }) {
  return (
    <>
      {runs.map((r, i) => {
        const lines = r.x.split(CELL_BR)
        return (
          <span
            key={i}
            title={r.s ? 'Зачёркнуто в оригинале памятки' : undefined}
            className={cn(
              r.b && 'font-semibold text-lavender-50',
              r.hl && 'bg-yellow-300/20 text-yellow-50 rounded-sm box-decoration-clone px-0.5',
              r.red && 'text-red-300',
              r.s && 'line-through opacity-60',
            )}
          >
            {lines.map((line, li) => (
              <span key={li}>
                {li > 0 && <br />}
                <Tokens text={line} query={query} />
              </span>
            ))}
          </span>
        )
      })}
    </>
  )
}

function Paragraph({
  runs,
  li,
  lvl = 0,
  warning,
  query,
}: {
  runs: Run[]
  li?: string
  lvl?: number
  warning?: boolean
  query: string
}) {
  if (warning) {
    return (
      <div className="flex gap-3 rounded-xl border border-amber-400/35 bg-amber-400/10 px-3.5 py-3">
        <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
        <div className="text-[14px] leading-relaxed text-amber-50 font-medium min-w-0">
          {li && <span className="mr-1.5 font-semibold">{li}</span>}
          <Runs runs={runs} query={query} />
        </div>
      </div>
    )
  }
  if (li) {
    return (
      <div className="flex gap-2 text-[14.5px] leading-relaxed text-lavender-100/90" style={{ paddingLeft: lvl * 18 }}>
        <span className={cn('shrink-0 min-w-[1.25rem] text-lavender-300', li === '•' ? 'text-center' : 'font-semibold')}>
          {li}
        </span>
        <div className="min-w-0">
          <Runs runs={runs} query={query} />
        </div>
      </div>
    )
  }
  return (
    <p className="text-[14.5px] leading-relaxed text-lavender-100/90">
      <Runs runs={runs} query={query} />
    </p>
  )
}

function GuideImage({ src }: { src: string }) {
  return (
    <a href={src} target="_blank" rel="noreferrer" className="block">
      <img
        src={src}
        alt="Изображение из памятки"
        loading="lazy"
        className="max-w-full max-h-[520px] rounded-xl border border-lavender-500/20 bg-white object-contain"
      />
    </a>
  )
}

/** Содержимое ячейки таблицы: абзацы, картинки, вложенные таблицы */
function CellContent({ cell, query }: { cell: Cell; query: string }) {
  return (
    <div className="space-y-1.5">
      {cell.c.map((b: RawBlock, i) => {
        if (b.t === 'p') return <Paragraph key={i} runs={b.runs} li={b.li} lvl={b.lvl} query={query} />
        if (b.t === 'img') return <GuideImage key={i} src={b.src} />
        return <DataTable key={i} rows={b.rows} query={query} />
      })}
    </div>
  )
}

/** Таблица как в Word: объединённые ячейки сохраняются, пустые остаются пустыми */
function DataTable({ rows, query }: { rows: Cell[][]; query: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-lavender-500/25">
      <table className="w-full text-[13.5px] border-collapse">
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={cn(ri === 0 && 'bg-lavender-600/15')}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  colSpan={cell.cs}
                  rowSpan={cell.rs}
                  className={cn(
                    'border border-lavender-500/20 px-3 py-2.5 align-top text-lavender-100/90 min-w-[96px]',
                    ci === 0 && 'bg-navy-900/40',
                  )}
                >
                  <CellContent cell={cell} query={query} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Block({ block, query }: { block: GuideBlock; query: string }) {
  switch (block.kind) {
    case 'p':
      return <Paragraph runs={block.runs} li={block.li} lvl={block.lvl} warning={block.warning} query={query} />
    case 'img':
      return <GuideImage src={block.src} />
    case 'pairs':
      return (
        <dl className="rounded-xl border border-lavender-500/20 divide-y divide-lavender-500/15 overflow-hidden">
          {block.rows.map((r, i) => (
            <div key={i} className="grid sm:grid-cols-[minmax(110px,30%)_1fr] gap-x-4 gap-y-1.5 px-3.5 py-3 bg-navy-900/40">
              <dt className="text-[13.5px] font-semibold text-lavender-300 min-w-0">
                <CellContent cell={r.key} query={query} />
              </dt>
              <dd className="text-[14px] leading-relaxed text-lavender-100/90 min-w-0">
                <CellContent cell={r.value} query={query} />
              </dd>
            </div>
          ))}
        </dl>
      )
    case 'table':
      return <DataTable rows={block.rows} query={query} />
  }
}

function countMatches(s: GuideSection, q: string): number {
  const needle = q.toLowerCase()
  let n = s.title.toLowerCase().split(needle).length - 1
  for (const b of s.blocks) n += guideBlockText(b).toLowerCase().split(needle).length - 1
  return n
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px] text-navy-300">
      <span className="inline-flex items-center gap-1">
        <span className="rounded-md px-1 font-mono font-bold bg-emerald-400/15 text-emerald-200 border border-emerald-400/40">0GP</span>
        код услуги — нажмите, чтобы скопировать
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="rounded-md px-1 font-bold bg-lavender-600/25 text-lavender-200 border border-lavender-500/30">PETC</span>
        SSR / ремарка
      </span>
      <span className="bg-yellow-300/20 text-yellow-50 rounded-sm px-1">выделено в оригинале</span>
      <span className="text-red-300">красным в оригинале</span>
      <span className="line-through opacity-60">зачёркнуто в оригинале</span>
    </div>
  )
}

export function AirlineGuideView({
  title,
  code,
  blocks,
  header,
}: {
  title: string
  code?: string | null
  blocks: RawBlock[]
  header?: string
}) {
  const guide = useMemo(() => parseGuide(blocks), [blocks])
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const q = query.trim()
  const matches = useMemo(
    () => (q.length >= 2 ? guide.sections.map((s) => countMatches(s, q)) : null),
    [guide, q],
  )
  const total = matches?.reduce((a, b) => a + b, 0) ?? 0
  const visible = guide.sections.filter((_, i) => !matches || matches[i] > 0)
  const chars = guide.sections.reduce((n, s) => n + s.blocks.reduce((m, b) => m + guideBlockText(b).length, 0), 0)
  const minutes = Math.max(1, Math.round(chars / 1200))

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

  if (!guide.sections.length && !guide.facts) {
    return <p className="text-center text-navy-400 py-10">Текст памятки пуст</p>
  }

  return (
    <div className="space-y-4">
      <section
        className="rounded-2xl border border-lavender-500/30 p-4 sm:p-5 space-y-4"
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
            {guide.meta.title && <p className="text-[13px] text-lavender-200 mt-0.5">{guide.meta.title}</p>}
            <p className="text-[12.5px] text-navy-300 mt-1">
              {[guide.meta.date && `Обновлено ${guide.meta.date}`, guide.meta.author, `~${minutes} мин чтения`]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>

        {guide.facts && <DataTable rows={guide.facts} query="" />}
      </section>

      <Legend />

      <div className="sticky top-[60px] z-30 -mx-1 px-1 py-2 app-bg space-y-2">
        <div className="relative">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти в памятке: PETC, 0GP, коляска…"
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

      {(guide.meta.document || header) && (
        <footer className="flex gap-2.5 rounded-xl border border-lavender-500/15 px-3.5 py-3 text-[12px] text-navy-400">
          <FileText className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Источник: {[guide.meta.document, header].filter(Boolean).join(' · ')}
          </span>
        </footer>
      )}
    </div>
  )
}
