// Проверка: парсер памяток (src/lib/airlineGuide.ts) не теряет и не добавляет текст.
// Запуск: node scripts/verify-guides.mts
import fs from 'node:fs'
import { parseGuide, guideBlockText, runsText } from '../src/lib/airlineGuide.ts'
const d = JSON.parse(fs.readFileSync(new URL('../public/ops/airline-guides.json', import.meta.url), 'utf8'))
const withLi = (blocks: any[]): string => blocks.map((b) => b.t === 'p' ? `${b.li ?? ''} ${runsText(b.runs)}` : b.t === 'table' ? b.rows.map((r: any[]) => r.map((c) => withLi(c.c)).join(' ')).join(' ') : '').join(' ')
const cellLi = (c: any) => withLi(c.c)
const norm = (s: string) => s.toLowerCase().replace(/[\s:]+/g, '')
const ms = (s: string) => { const m = new Map<string, number>(); for (const ch of norm(s)) m.set(ch, (m.get(ch) ?? 0) + 1); return m }
const paras = (blocks: any[], out: string[] = []) => { for (const b of blocks) { if (b.t === 'p') out.push(runsText(b.runs)); else if (b.t === 'table') for (const r of b.rows) for (const c of r) paras(c.c, out) } return out }
let bad = 0, checkedParas = 0
for (const g of d.airlineGuides) {
  const p = parseGuide(g.blocks)
  let out = [p.meta.document, p.meta.author, p.meta.date, p.meta.title].filter((x) => x !== undefined).join(' ')
  if (p.facts) out += ' ' + p.facts.map((r) => r.map(cellLi).join(' ')).join(' ')
  for (const s of p.sections) {
    out += ' ' + (s.id === 's0' && s.title === 'Общее' ? '' : s.title)
    for (const b of s.blocks) out += ' ' + (b.kind === 'pairs' ? b.rows.map((r) => cellLi(r.key) + ' ' + cellLi(r.value)).join(' ') : b.kind === 'table' ? b.rows.map((r) => r.map(cellLi).join(' ')).join(' ') : guideBlockText(b))
  }
  const labels = [['документ', p.meta.document], ['исполнитель', p.meta.author], ['дата', p.meta.date]].filter(([, v]) => v !== undefined).map(([k]) => k as string)
  const A = ms(withLi(g.blocks)), B = ms(out + ' ' + labels.join(' '))
  const diff: string[] = []
  for (const k of new Set([...A.keys(), ...B.keys()])) { const x = (A.get(k) ?? 0) - (B.get(k) ?? 0); if (x) diff.push(`${JSON.stringify(k)}:${x > 0 ? 'lost ' + x : 'extra ' + -x}`) }
  const O = norm(out)
  const missing = paras(g.blocks).filter((t) => { checkedParas++; return !labels.includes(t.trim().toLowerCase()) && !O.includes(norm(t)) })
  if (diff.length || missing.length) { bad++; console.log(g.id, diff.join(', '), missing.map((m) => JSON.stringify(m.slice(0, 80)))) }
}
console.log('guides', d.airlineGuides.length, 'paragraphs/cells checked', checkedParas, 'guides with problems', bad)
if (bad) process.exit(1)
