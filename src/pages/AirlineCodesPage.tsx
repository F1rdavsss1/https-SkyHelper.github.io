import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Search } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Input } from '../components/ui/Input'
import { AirlineAvatar } from '../components/AirlineGuideView'
import { airlineCodes } from '../data/ops/airlineCodes'
import { loadAirlineGuides, type AirlineGuide } from '../lib/guidesStore'

export function AirlineCodesPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [guides, setGuides] = useState<AirlineGuide[]>([])

  useEffect(() => {
    loadAirlineGuides().then((d) => setGuides(d.airlineGuides))
  }, [])

  const byCode = useMemo(() => {
    const m = new Map<string, AirlineGuide[]>()
    for (const g of guides) {
      for (const code of (g.airlineCode ?? '').split(/[^A-Z0-9]+/).filter(Boolean)) {
        m.set(code, [...(m.get(code) ?? []), g])
      }
    }
    return m
  }, [guides])

  const query = q.trim().toLowerCase()
  const list = airlineCodes.filter((a) => !query || a.code.toLowerCase().includes(query) || a.name.toLowerCase().includes(query))

  return (
    <div className="min-h-dvh page-pad app-bg">
      <PageHeader title="🔤 Коды авиакомпаний" subtitle={`${airlineCodes.length} кодов — список от агентов`} />
      <main className="page-wrap py-4 space-y-3">
        <div className="relative">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Код или название: N4, Победа…" className="pl-11" />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => {
            const memo = byCode.get(a.code)?.[0]
            return (
              <button
                key={a.code}
                type="button"
                disabled={!memo}
                onClick={() => memo && navigate(`/knowledge/airlines/${memo.id}`)}
                className="flex items-center gap-3 rounded-xl border border-lavender-500/25 bg-[#2a2a32] p-3 text-left enabled:hover:border-lavender-400/50 disabled:cursor-default"
              >
                <AirlineAvatar code={a.code} />
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold text-lavender-100 truncate">{a.name}</div>
                  <div className="text-[12px] text-navy-400">{memo ? 'есть памятка' : 'памятки нет'}</div>
                </div>
                {memo && <ChevronRight className="w-5 h-5 text-navy-500" />}
              </button>
            )
          })}
        </div>
        {!list.length && <p className="text-center text-navy-400 py-10">Ничего не найдено</p>}
      </main>
    </div>
  )
}
