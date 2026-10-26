import { useMemo } from 'react'
import { FileText } from 'lucide-react'
import { cn } from '../lib/utils'
import {
  airlineHue,
  guideBlockText,
  guideDisplayName,
  parseGuide,
  type GuideMeta,
  type ParsedGuide,
  type RawBlock,
} from '../lib/airlineGuide'
import { parseDsl } from '../lib/opsDsl'
import { DataTable, Legend, SectionsReader } from './guide/GuideBlocks'

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

export function AirlineGuideView({
  title,
  code,
  blocks,
  dsl,
  meta,
  header,
  sourceNote,
  initialQuery,
}: {
  title: string
  code?: string | null
  /** Памятка из .docx / .xlsx */
  blocks?: RawBlock[]
  /** Памятка, набранная вручную (скан, PDF) — формат opsDsl */
  dsl?: string
  meta?: GuideMeta
  header?: string
  /** Откуда взят текст, если это не .docx (например «Расшифровано со скана PDF») */
  sourceNote?: string
  /** Поиск из общего поиска справочника (?q=) */
  initialQuery?: string
}) {
  const guide: ParsedGuide = useMemo(() => {
    if (dsl) return { meta: meta ?? {}, facts: null, sections: parseDsl(dsl) }
    return parseGuide(blocks ?? [])
  }, [blocks, dsl, meta])
  const chars = guide.sections.reduce((n, s) => n + s.blocks.reduce((m, b) => m + guideBlockText(b).length, 0), 0)
  const minutes = Math.max(1, Math.round(chars / 1200))

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
        {sourceNote && (
          <p className="text-[12px] text-sky-200 bg-sky-400/10 border border-sky-400/25 rounded-lg px-3 py-2">{sourceNote}</p>
        )}
      </section>

      <Legend />

      <SectionsReader sections={guide.sections} initialQuery={initialQuery} />

      {(guide.meta.document || header) && (
        <footer className="flex gap-2.5 rounded-xl border border-lavender-500/15 px-3.5 py-3 text-[12px] text-navy-400">
          <FileText className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Источник: {[guide.meta.document, header].filter(Boolean).join(' · ')}</span>
        </footer>
      )}
    </div>
  )
}
