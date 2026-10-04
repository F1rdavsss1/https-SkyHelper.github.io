import { useState } from 'react'
import { Check, ChevronDown, ClipboardList } from 'lucide-react'
import { phaseLabelRu, specialPassengerGuides } from '../data/specialGuides'
import type { ChecklistItem, SpecialPassengerCategory, SpecialPassengerCount } from '../types'

interface AgentCheckPanelProps {
  onFlight: SpecialPassengerCount[]
}

const PHASE_ORDER: NonNullable<ChecklistItem['phase']>[] = ['prep', 'desk', 'gate', 'after']

function groupByPhase(items: ChecklistItem[]) {
  const groups: { phase: NonNullable<ChecklistItem['phase']> | 'other'; items: ChecklistItem[] }[] = []
  const map = new Map<string, ChecklistItem[]>()
  for (const item of items) {
    const key = item.phase ?? 'other'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  for (const phase of PHASE_ORDER) {
    const list = map.get(phase)
    if (list?.length) groups.push({ phase, items: list })
  }
  const other = map.get('other')
  if (other?.length) groups.push({ phase: 'other', items: other })
  return groups
}

export function AgentCheckPanel({ onFlight }: AgentCheckPanelProps) {
  const [openId, setOpenId] = useState<string | null>(() => {
    const first = onFlight[0]
    if (!first) return '1'
    return specialPassengerGuides.find((g) => g.category === first.category)?.id ?? '1'
  })
  const [done, setDone] = useState<Record<string, Set<string>>>({})

  const countByCat = Object.fromEntries(onFlight.map((s) => [s.category, s.count])) as Partial<
    Record<SpecialPassengerCategory, number>
  >

  const toggleItem = (guideId: string, itemId: string) => {
    setDone((prev) => {
      const set = new Set(prev[guideId] ?? [])
      if (set.has(itemId)) set.delete(itemId)
      else set.add(itemId)
      return { ...prev, [guideId]: set }
    })
  }

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-[15px] font-bold text-lavender-200 flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          Как зарегистрировать на стойке
        </h3>
        <p className="text-[13px] text-navy-400 mt-1">
          Подробные действия по этапам: до стойки → регистрация → гейт
        </p>
      </div>

      {onFlight.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {onFlight.map((sp) => {
            const g = specialPassengerGuides.find((x) => x.category === sp.category)
            if (!g) return null
            return (
              <button
                key={sp.category}
                type="button"
                onClick={() => setOpenId(g.id)}
                className={`px-3 py-2 rounded-xl text-[13px] font-semibold border ${
                  openId === g.id
                    ? 'bg-lavender-600 text-white border-lavender-400'
                    : 'bg-amber-500/15 text-amber-200 border-amber-500/40'
                }`}
              >
                {g.icon} {g.titleRu} — {sp.count}
              </button>
            )
          })}
        </div>
      )}

      <div className="space-y-2">
        {specialPassengerGuides.map((guide) => {
          const isOpen = openId === guide.id
          const onThis = countByCat[guide.category]
          const checked = done[guide.id] ?? new Set()
          const progress = guide.checklist.length
            ? Math.round((checked.size / guide.checklist.length) * 100)
            : 0
          const groups = groupByPhase(guide.checklist)

          return (
            <div
              key={guide.id}
              className={`rounded-2xl border overflow-hidden ${
                onThis
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : 'border-lavender-500/25 bg-[#2a2a32]'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : guide.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <span className="text-2xl">{guide.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-lavender-100">
                    {guide.titleRu}
                    {onThis ? (
                      <span className="ml-2 text-[12px] font-bold text-amber-300">
                        на рейсе ×{onThis}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[12px] text-navy-400 truncate">{guide.descriptionRu}</div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-lavender-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-4 border-t border-lavender-500/20 pt-3">
                  {guide.tipRu && (
                    <p className="text-[13px] text-lavender-200/90 bg-lavender-600/15 border border-lavender-500/25 rounded-xl px-3 py-2">
                      {guide.tipRu}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-lavender-300">
                      Чеклист · {guide.checklist.length} шагов
                    </span>
                    <span className="text-[12px] text-lavender-400">{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-navy-700 overflow-hidden">
                    <div
                      className="h-full bg-lavender-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {groups.map((group) => (
                    <div key={group.phase} className="space-y-2">
                      <h4 className="text-[12px] font-bold uppercase tracking-wide text-lavender-400 pt-1">
                        {group.phase === 'other' ? 'Действия' : phaseLabelRu[group.phase]}
                      </h4>
                      {group.items.map((item) => {
                        const ok = checked.has(item.id)
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleItem(guide.id, item.id)}
                            className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                              ok
                                ? 'bg-green-500/10 border-green-500/30'
                                : 'bg-[#1e1e24] border-lavender-500/20'
                            }`}
                          >
                            <span
                              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                ok ? 'bg-green-500 border-green-500' : 'border-lavender-500/50'
                              }`}
                            >
                              {ok && <Check className="w-3 h-3 text-white" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span
                                className={`block text-[14px] font-medium ${
                                  ok ? 'text-navy-400 line-through' : 'text-lavender-100'
                                }`}
                              >
                                {item.textRu}
                              </span>
                              {item.detailRu && (
                                <span
                                  className={`block text-[12px] mt-1 leading-snug ${
                                    ok ? 'text-navy-500' : 'text-navy-300'
                                  }`}
                                >
                                  {item.detailRu}
                                </span>
                              )}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  ))}

                  <button
                    type="button"
                    className="text-[12px] text-lavender-400 mt-1"
                    onClick={() => setDone((p) => ({ ...p, [guide.id]: new Set() }))}
                  >
                    Сбросить чеклист
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
