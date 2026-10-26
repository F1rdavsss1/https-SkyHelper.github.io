/** Разбор текста памятки АК (из .docx, строки таблиц через « | ») в структурированные блоки */

export type GuideBlock =
  | { kind: 'text'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'warning'; text: string }
  | { kind: 'pairs'; rows: { key: string; value: string }[] }
  | { kind: 'table'; rows: string[][] }

export interface GuideSection {
  id: string
  title: string
  blocks: GuideBlock[]
}

export interface GuideMeta {
  document?: string
  author?: string
  date?: string
}

export interface ParsedGuide {
  meta: GuideMeta
  /** «Шапка» памятки: код, телефон, DCS, офис, бирки, касса — строками ячеек */
  facts: string[][]
  sections: GuideSection[]
}

const META_KEYS: Record<string, keyof GuideMeta> = {
  документ: 'document',
  исполнитель: 'author',
  дата: 'date',
}

const SEP = ' | '
/** Перенос строки внутри ячейки таблицы (см. scripts/import_pulkovo.py) */
export const CELL_BR = String.fromCharCode(0x2028)

const WARNING_RE = /(ВАЖНО|ЗАПРЕЩ|НЕЛЬЗЯ|СТРОГО|ОБЯЗАТЕЛЬНО|НЕ ДОПУСКА|!!)/

function isMostlyUpper(s: string): boolean {
  const letters = s.replace(/[^A-Za-zА-Яа-яЁё]/g, '')
  if (letters.length < 15) return false
  const upper = letters.replace(/[^A-ZА-ЯЁ]/g, '').length
  return upper / letters.length > 0.7
}

function isHeading(line: string): boolean {
  if (line.includes(SEP) || line.length > 40) return false
  if (/:\s*$/.test(line)) return true
  // Короткие «Особенности», «Посадка», «Low cost»: без цифр и без точки в конце
  return line.length <= 28 && !/[\d.!?,;]/.test(line) && line.split(/\s+/).length <= 3
}

function cleanHeading(line: string): string {
  const t = line.replace(/:\s*$/, '').trim()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

function isFactLine(line: string): boolean {
  return /(Название а\/к|Host|DCS|бирки|Бирки|Касса|посадочные|Посадочные|Офис|Телефон|Тел\.)/.test(line)
}

function tableBlock(rows: string[][]): GuideBlock {
  const twoCol = rows.filter((r) => r.length === 2).length
  if (twoCol / rows.length >= 0.6) {
    return {
      kind: 'pairs',
      rows: rows.map((r) =>
        r.length === 2 ? { key: r[0], value: r[1] } : { key: '', value: r.join(' · ') },
      ),
    }
  }
  // Строка заголовков часто без первой (пустой) ячейки — выравниваем вправо
  const width = Math.max(...rows.map((r) => r.length))
  const [head, ...rest] = rows
  const padded = head.length < width ? [[...Array(width - head.length).fill(''), ...head], ...rest] : rows
  return { kind: 'table', rows: padded }
}

/** «DCS:» + «Amadeus» → «DCS: Amadeus» */
function mergeLabelCells(cells: string[]): string[] {
  const out: string[] = []
  for (const raw of cells) {
    // «Название а/к:» — подпись без значения, название и так в заголовке
    const c = raw.replace(/^Название а\/к:?\s*/i, '')
    if (!c) continue
    const prev = out[out.length - 1]
    if (prev && /:$/.test(prev) && !c.includes(':')) out[out.length - 1] = `${prev} ${c}`
    else out.push(c)
  }
  return out
}

function lineBlock(line: string): GuideBlock {
  if (/^[-−–•·]\s*/.test(line)) {
    const text = line.replace(/^[-−–•·]\s*/, '')
    return { kind: WARNING_RE.test(text) ? 'warning' : 'bullet', text }
  }
  if (WARNING_RE.test(line) || isMostlyUpper(line)) return { kind: 'warning', text: line }
  return { kind: 'text', text: line }
}

export function parseGuide(body: string): ParsedGuide {
  const meta: GuideMeta = {}
  const facts: string[][] = []
  const sections: GuideSection[] = []
  let current: GuideSection = { id: 's0', title: 'Общее', blocks: [] }
  let tableRows: string[][] = []
  let seenTitle = false
  let inFacts = false

  const flushTable = () => {
    if (tableRows.length) current.blocks.push(tableBlock(tableRows))
    tableRows = []
  }
  const startSection = (title: string) => {
    flushTable()
    if (current.blocks.length) sections.push(current)
    current = { id: `s${sections.length + 1}`, title, blocks: [] }
  }

  for (const raw of body.split('\n')) {
    const line = raw.split(CELL_BR).map((p) => p.replace(/\s+/g, ' ').trim()).join(CELL_BR).trim()
    if (!line) continue

    const cells = line.split(SEP).map((c) => c.trim()).filter(Boolean)
    const metaKey = cells.length === 2 ? META_KEYS[cells[0].toLowerCase()] : undefined
    if (metaKey && !meta[metaKey]) {
      meta[metaKey] = cells[1]
      continue
    }

    // Заголовок «Памятка а/к …» дублирует название — пропускаем
    if (/^Памятка а\/к/i.test(line)) {
      seenTitle = true
      continue
    }

    // Шапка с контактами идёт до первого раздела: строки с «Касса», «Офис», телефоны и их продолжения
    const atStart = !sections.length && !current.blocks.length && !tableRows.length
    const isPhoneOnly = /^[+\d\s()-]+$/.test(line)
    if (atStart && (isFactLine(line) || (inFacts && (cells.length > 1 || isPhoneOnly)))) {
      inFacts = true
      facts.push(mergeLabelCells(cells))
      continue
    }
    inFacts = false

    if (isHeading(line) && (seenTitle || sections.length || current.blocks.length)) {
      startSection(cleanHeading(line))
      continue
    }

    if (cells.length > 1) {
      tableRows.push(cells)
      continue
    }

    flushTable()
    current.blocks.push(lineBlock(line))
  }

  flushTable()
  if (current.blocks.length) sections.push(current)
  return { meta, facts, sections }
}

/** Коды SSR и служебные сокращения, которые подсвечиваются в тексте */
export const SSR_CODES = new Set([
  'INF', 'CHD', 'UM', 'UMNR', 'PETC', 'AVIH', 'SVAN', 'ESAN', 'WEAP', 'SPEQ', 'CBBG', 'PREG', 'EXST',
  'EXBAG', 'STCR', 'MEDA', 'BLND', 'DEAF', 'DPNA', 'DEPU', 'DEPA', 'INAD', 'PRM', 'WCHR', 'WCHS', 'WCHC',
  'WCMP', 'WCBD', 'WCBW', 'ICTI', 'XBAG', 'BIKE', 'FRAG', 'MAAS', 'SEMN', 'EMD', 'DCS', 'PIL', 'VIP',
])

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

/** Ищет телефоны вида +7(931)228-98-59, 89218606801 */
export const PHONE_RE = /(\+?\d[\d\s()-]{8,}\d)/g

export function phoneHref(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '')
  return `tel:${digits.startsWith('8') && digits.length === 11 ? `+7${digits.slice(1)}` : digits}`
}
