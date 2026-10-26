// Проверка: разделы справочника в формате opsDsl (src/data/ops) — каждая строка текста попадает на страницу.
// Запуск: node --import ./scripts/ts-resolve.mjs scripts/verify-ops-docs.mts
import { parseDsl } from '../src/lib/opsDsl.ts'
import { guideBlockText, cellText } from '../src/lib/airlineGuide.ts'
import { dslDocs } from '../src/data/ops/catalog.ts'
import { extraGuides } from '../src/data/ops/extraGuides.ts'

const norm = (s: string) => s.toLowerCase().replace(/\*\*|==|<br>/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[\s:|]+/g, '')
let bad = 0, lines = 0
for (const d of [...dslDocs.map((x) => ({ id: x.id, text: x.text })), ...extraGuides.map((g) => ({ id: g.id, text: g.dsl }))]) {
  const sections = parseDsl(d.text)
  const out = norm(sections.map((s) => s.title + ' ' + s.blocks.map((b) => (b.kind === 'pairs' ? b.rows.map((r) => cellText(r.key) + ' ' + cellText(r.value)).join(' ') : b.kind === 'table' ? b.rows.map((r) => r.map(cellText).join(' ')).join(' ') : guideBlockText(b))).join(' ')).join(' '))
  for (const raw of d.text.split('\n')) {
    const line = raw.trim().replace(/^(#{2,3}|[-•✓!>]|\d{1,2}[.)])\s+/, '')
    if (!line || /^\|[\s:|-]+\|$/.test(raw.trim()) || /^!\[/.test(raw.trim())) continue
    lines++
    for (const part of line.split('|').map(norm).filter(Boolean)) {
      if (!out.includes(part)) { bad++; console.log(d.id, 'MISSING:', line.slice(0, 90)) }
    }
  }
}
console.log('docs', dslDocs.length + extraGuides.length, 'lines', lines, 'missing', bad)
if (bad) process.exit(1)
