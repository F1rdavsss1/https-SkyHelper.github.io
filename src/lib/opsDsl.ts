/**
 * Разделы справочника, написанные вручную (контакты, посадка, Astra и т.п.), в простом формате:
 *
 *   ## Раздел            — новый раздел
 *   ### Подзаголовок     — жирная строка внутри раздела
 *   - пункт / • пункт    — маркированный пункт
 *   1. пункт / 1) пункт  — нумерованный пункт (номер берётся из текста как есть)
 *   ! текст              — предупреждение (жёлтая плашка)
 *   > текст              — примечание
 *   | a | b |            — строки таблицы (подряд идущие); 2 колонки → карточки «ключ — значение»
 *   ![подпись](/путь)    — картинка
 *
 * В тексте: **жирный**, ==выделено==, [текст](https://ссылка), <br> — перенос строки.
 */

import { CELL_BR, tableBlock, type Cell, type GuideSection, type Run } from './airlineGuide'

const INLINE_RE = /\*\*(.+?)\*\*|==(.+?)==|\[([^\]]+)\]\(([^)\s]+)\)/g

export function inlineRuns(text: string): Run[] {
  const src = text.replace(/<br\s*\/?>/g, CELL_BR)
  const runs: Run[] = []
  let last = 0
  for (const m of src.matchAll(INLINE_RE)) {
    const i = m.index ?? 0
    if (i > last) runs.push({ x: src.slice(last, i) })
    if (m[1] !== undefined) runs.push({ x: m[1], b: 1 })
    else if (m[2] !== undefined) runs.push({ x: m[2], hl: 1 })
    else runs.push({ x: m[3], href: m[4] })
    last = i + m[0].length
  }
  if (last < src.length) runs.push({ x: src.slice(last) })
  return runs
}

function cell(text: string): Cell {
  const t = text.trim()
  return { c: t ? [{ t: 'p', runs: inlineRuns(t) }] : [] }
}

export function parseDsl(text: string): GuideSection[] {
  const sections: GuideSection[] = []
  let current: GuideSection = { id: 's0', title: 'Общее', blocks: [] }
  let rows: Cell[][] = []

  const flushTable = () => {
    if (rows.length) current.blocks.push(tableBlock(rows))
    rows = []
  }

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (line.startsWith('|')) {
      if (/^\|[\s:|-]+\|$/.test(line)) continue // разделитель |---|---|
      rows.push(line.replace(/^\||\|$/g, '').split('|').map(cell))
      continue
    }
    flushTable()
    if (!line) continue

    if (line.startsWith('## ')) {
      if (current.blocks.length) sections.push(current)
      current = { id: `s${sections.length + 1}`, title: line.slice(3).trim(), blocks: [] }
      continue
    }
    if (line.startsWith('### ')) {
      current.blocks.push({ kind: 'p', runs: inlineRuns(`**${line.slice(4).trim()}**`), warning: false })
      continue
    }
    const img = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/)
    if (img) {
      current.blocks.push({ kind: 'img', src: img[2] })
      continue
    }
    if (line.startsWith('! ')) {
      current.blocks.push({ kind: 'p', runs: inlineRuns(line.slice(2)), warning: true })
      continue
    }
    if (line.startsWith('> ')) {
      current.blocks.push({ kind: 'p', runs: inlineRuns(line.slice(2)), warning: false, note: true })
      continue
    }
    const bullet = line.match(/^[-•✓]\s+(.*)$/)
    if (bullet) {
      current.blocks.push({ kind: 'p', runs: inlineRuns(bullet[1]), li: '•', warning: false })
      continue
    }
    const num = line.match(/^(\d{1,2}[.)])\s+(.*)$/)
    if (num) {
      current.blocks.push({ kind: 'p', runs: inlineRuns(num[2]), li: num[1], warning: false })
      continue
    }
    current.blocks.push({ kind: 'p', runs: inlineRuns(line), warning: false })
  }
  flushTable()
  if (current.blocks.length) sections.push(current)
  return sections
}

export interface OpsDoc {
  id: string
  title: string
  icon: string
  description: string
  /** Откуда взято: «Памятка сотрудника Пулково (печать)», «Сообщение пользователя» и т.п. */
  source?: string
  /** Текст в формате opsDsl (см. начало файла) */
  text: string
}
