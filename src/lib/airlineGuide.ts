/**
 * Памятки АК: структура из .docx (см. scripts/import_pulkovo.py) → разделы для экрана.
 * Текст не меняется и не переставляется — только раскладывается по разделам и оформлению.
 */

export interface Run {
  x: string
  /** жирный */
  b?: 1
  /** зачёркнуто */
  s?: 1
  /** выделено маркером / заливкой */
  hl?: 1
  /** красный шрифт */
  red?: 1
}

export interface Cell {
  c: RawBlock[]
  cs?: number
  rs?: number
}

export type RawBlock =
  | { t: 'p'; runs: Run[]; li?: string; lvl?: number }
  | { t: 'img'; src: string }
  | { t: 'table'; rows: Cell[][] }

export type GuideBlock =
  | { kind: 'p'; runs: Run[]; li?: string; lvl?: number; warning: boolean }
  | { kind: 'img'; src: string }
  | { kind: 'pairs'; rows: { key: Cell; value: Cell }[] }
  | { kind: 'table'; rows: Cell[][] }

export interface GuideSection {
  id: string
  title: string
  blocks: GuideBlock[]
}

export interface GuideMeta {
  document?: string
  author?: string
  date?: string
  /** Заголовок из документа, например «Памятка а/к SU(FV)«Аэрофлот» (Россия)» */
  title?: string
}

export interface ParsedGuide {
  meta: GuideMeta
  /** Таблица-«шапка»: код, телефон, DCS, офис, бирки, касса — как в документе */
  facts: Cell[][] | null
  sections: GuideSection[]
}

/** Перенос строки внутри абзаца/ячейки */
export const CELL_BR = String.fromCharCode(0x2028)

const META_KEYS: Record<string, keyof GuideMeta> = {
  документ: 'document',
  исполнитель: 'author',
  дата: 'date',
}

const WARNING_RE = /(ВАЖНО|ВНИМАНИЕ|ЗАПРЕЩ|НЕЛЬЗЯ|СТРОГО|ОБЯЗАТЕЛЬНО|НЕ ДОПУСКА|!!)/

export function runsText(runs: Run[]): string {
  return runs.map((r) => r.x).join('')
}

export function cellText(cell: Cell): string {
  return blocksText(cell.c)
}

function blocksText(blocks: RawBlock[]): string {
  return blocks
    .map((b) => {
      if (b.t === 'p') return runsText(b.runs)
      if (b.t === 'table') return b.rows.map((r) => r.map(cellText).join(' ')).join(' ')
      return ''
    })
    .join(' ')
}

export function guideBlockText(b: GuideBlock): string {
  if (b.kind === 'p') return `${b.li ?? ''} ${runsText(b.runs)}`
  if (b.kind === 'pairs') return b.rows.map((r) => `${cellText(r.key)} ${cellText(r.value)}`).join(' ')
  if (b.kind === 'table') return b.rows.map((r) => r.map(cellText).join(' ')).join(' ')
  return ''
}

function isMostlyUpper(s: string): boolean {
  const letters = s.replace(/[^A-Za-zА-Яа-яЁё]/g, '')
  if (letters.length < 15) return false
  const upper = letters.replace(/[^A-ZА-ЯЁ]/g, '').length
  return upper / letters.length > 0.7
}

function isFactText(s: string): boolean {
  return /(Название а\/к|Host|DCS|бирки|Касса|посадочные|Офис|Телефон|Тел\.)/i.test(s)
}

/** Короткий абзац-заголовок: «Регистрация:», «Особенности», жирное «Посадка» */
function headingOf(block: Extract<RawBlock, { t: 'p' }>): string | null {
  if (block.li) return null
  const text = runsText(block.runs).trim()
  if (!text || text.length > 40 || text.includes(CELL_BR)) return null
  // «- букет цветов», «4. Все пассажиры…» — пункты списка, не заголовки
  if (/^([-−–•·*]|\d+[.)])/.test(text)) return null
  const allBold = block.runs.every((r) => r.b || !r.x.trim())
  if (/:$/.test(text) || (allBold && !/[.!?;,]$/.test(text)) || (text.length <= 28 && !/[\d.!?,;]/.test(text) && text.split(/\s+/).length <= 3)) {
    const t = text.replace(/:$/, '').trim()
    return t.charAt(0).toUpperCase() + t.slice(1)
  }
  return null
}

/** «Регистрация: По тарифу …» (жирная подпись в начале абзаца) → заголовок + абзац */
function splitLeadHeading(block: Extract<RawBlock, { t: 'p' }>): [string, Run[]] | null {
  const first = block.runs[0]
  if (block.li || !first?.b) return null
  const m = first.x.match(/^([^:]{2,30}):\s*/)
  if (!m || m[0].length === first.x.length + 1) return null
  const rest = [{ ...first, x: first.x.slice(m[0].length) }, ...block.runs.slice(1)].filter((r) => r.x)
  if (!runsText(rest).trim()) return null
  return [m[1].trim(), rest]
}

function tableBlock(rows: Cell[][]): GuideBlock {
  const pairs = rows.every((r) => r.length === 2 && r.every((c) => !c.cs && !c.rs))
  if (pairs) return { kind: 'pairs', rows: rows.map(([key, value]) => ({ key, value })) }
  return { kind: 'table', rows }
}

export function parseGuide(raw: RawBlock[]): ParsedGuide {
  const meta: GuideMeta = {}
  let facts: Cell[][] | null = null
  const sections: GuideSection[] = []
  let current: GuideSection = { id: 's0', title: 'Общее', blocks: [] }

  const startSection = (title: string, source: Run[]) => {
    // Два заголовка подряд («Регистрация:» → «Mane line»): второй — подзаголовок внутри первого
    if (!current.blocks.length && current.id !== 's0') {
      current.blocks.push({ kind: 'p', runs: source.map((r) => ({ ...r, b: 1 })), warning: false })
      return
    }
    if (current.blocks.length) sections.push(current)
    current = { id: `s${sections.length + 1}`, title, blocks: [] }
  }
  const atStart = () => !sections.length && !current.blocks.length

  for (const block of raw) {
    if (block.t === 'img') {
      current.blocks.push({ kind: 'img', src: block.src })
      continue
    }

    if (block.t === 'table') {
      // Строки «документ / исполнитель / дата» → сведения об источнике
      const rows = block.rows.filter((r) => {
        const key = r.length === 2 ? META_KEYS[cellText(r[0]).trim().toLowerCase()] : undefined
        if (key && !meta[key]) {
          meta[key] = cellText(r[1]).trim()
          return false
        }
        return true
      })
      if (!rows.length) continue
      if (atStart() && !facts && isFactText(rows.map((r) => r.map(cellText).join(' ')).join(' '))) {
        facts = rows
        continue
      }
      current.blocks.push(tableBlock(rows))
      continue
    }

    const text = runsText(block.runs).trim()
    // \b в JS не работает с кириллицей — граница слова через пробел/конец строки
    if (!meta.title && /^Памятка(\s|$)/i.test(text)) {
      meta.title = text
      continue
    }

    const heading = headingOf(block)
    if (heading) {
      startSection(heading, block.runs)
      continue
    }
    const lead = splitLeadHeading(block)
    if (lead) {
      startSection(lead[0], [{ ...block.runs[0], x: `${lead[0]}:` }])
      const restText = runsText(lead[1])
      current.blocks.push({ kind: 'p', runs: lead[1], warning: WARNING_RE.test(restText) || isMostlyUpper(restText) })
      continue
    }

    current.blocks.push({
      kind: 'p',
      runs: block.runs,
      li: block.li,
      lvl: block.lvl,
      warning: WARNING_RE.test(text) || isMostlyUpper(text),
    })
  }

  if (current.blocks.length) sections.push(current)
  return { meta, facts, sections }
}

/** Коды SSR и служебные сокращения — бейджи в тексте */
export const SSR_CODES = new Set([
  'INF', 'INFT', 'CHD', 'UM', 'UMNR', 'PETC', 'AVIH', 'SVAN', 'ESAN', 'WEAP', 'SPEQ', 'CBBG', 'PREG', 'EXST',
  'EXBAG', 'STCR', 'MEDA', 'BLND', 'DEAF', 'DPNA', 'DEPU', 'DEPA', 'INAD', 'PRM', 'WCHR', 'WCHS', 'WCHC',
  'WCMP', 'WCBD', 'WCBW', 'WCLB', 'ICTI', 'XBAG', 'BIKE', 'FRAG', 'MAAS', 'SEMN', 'EMD', 'DCS', 'PIL', 'VIP',
  'RFISC', 'PNR', 'GSTANDBY', 'FQTV', 'OTHS', 'PSM', 'TIMATIC', 'OXYG', 'POXY', 'LANG', 'MEQT', 'DOCS',
])

/** Кириллица, похожая на латиницу: в DCS коды вводятся латиницей */
const LOOKALIKE: Record<string, string> = {
  А: 'A', В: 'B', С: 'C', Е: 'E', Н: 'H', К: 'K', М: 'M', О: 'O', Р: 'P', Т: 'T', Х: 'X',
}
const CODE_CHARS = '0-9A-ZАВСЕНКМОРТХ'

/**
 * Коды услуг (RFISC и т.п.): 08A, 0GP, 0L0, K23, EW1, SR3 — ровно 3 символа,
 * начинаются с 0 или с буквы, за которой есть цифра.
 */
export const SERVICE_CODE_RE = new RegExp(
  // «0» + 2 символа, но не хвост числа вроде «1 000»; либо буква + 2 символа, среди которых есть цифра
  `(?<![0-9A-Za-zА-Яа-яЁё])(?:(?<![0-9][ .,])0[${CODE_CHARS}]{2}|[A-ZАВСЕНКМОРТХ](?=[${CODE_CHARS}]{0,1}[0-9])[${CODE_CHARS}]{2})(?![0-9A-Za-zА-Яа-яЁё])`,
)

export function toLatinCode(code: string): string {
  return [...code].map((c) => LOOKALIKE[c] ?? c).join('')
}

/** Телефоны вида +7(931)228-98-59, 89218606801 */
export const PHONE_RE = /\+?\d[\d\s()-]{8,}\d/

export function phoneHref(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '')
  return `tel:${digits.startsWith('8') && digits.length === 11 ? `+7${digits.slice(1)}` : digits}`
}

/** Стабильный оттенок цвета для аватара АК */
export function airlineHue(code?: string | null): number {
  let h = 0
  for (const ch of code || '?') h = (h * 31 + ch.charCodeAt(0)) % 360
  return h
}

/** «3F Fly one - Armenia» → «Fly one - Armenia» */
export function guideDisplayName(title: string, code?: string | null): string {
  if (code && title.toUpperCase().startsWith(code)) {
    const rest = title.slice(code.length).trim()
    if (rest) return rest
  }
  return title
}
