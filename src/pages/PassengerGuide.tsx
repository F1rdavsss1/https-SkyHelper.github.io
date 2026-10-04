import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { specialPassengerGuides, phaseLabelRu } from '../data/specialGuides'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ArrowLeft, Check } from 'lucide-react'
import type { ChecklistItem } from '../types'

const PHASE_ORDER: NonNullable<ChecklistItem['phase']>[] = ['prep', 'desk', 'gate', 'after']

export function PassengerGuide() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const guide = specialPassengerGuides.find((g) => g.id === id)
  const [checklist, setChecklist] = useState(
    () => guide?.checklist.map((item) => ({ ...item })) || []
  )

  useEffect(() => {
    setChecklist(guide?.checklist.map((item) => ({ ...item })) || [])
  }, [guide])

  const groups = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>()
    for (const item of checklist) {
      const key = item.phase ?? 'other'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }
    const out: { phase: string; items: ChecklistItem[] }[] = []
    for (const phase of PHASE_ORDER) {
      const list = map.get(phase)
      if (list?.length) out.push({ phase, items: list })
    }
    const other = map.get('other')
    if (other?.length) out.push({ phase: 'other', items: other })
    return out
  }, [checklist])

  if (!guide) {
    return (
      <div className="min-h-dvh app-bg flex items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-h1 mb-2">Памятка не найдена</h2>
          <Button onClick={() => navigate(-1)}>Вернуться</Button>
        </div>
      </div>
    )
  }

  const toggle = (itemId: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item))
    )
  }

  const completedCount = checklist.filter((i) => i.completed).length
  const progress = checklist.length ? (completedCount / checklist.length) * 100 : 0

  return (
    <div className="min-h-dvh pb-10 app-bg">
      <header className="sticky top-0 z-40 glass border-b border-lavender-500/25">
        <div className="mx-auto max-w-3xl px-2 sm:px-4 py-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="touch-target flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-lavender-200" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] font-semibold text-lavender-100 truncate">{guide.titleRu}</h1>
            <p className="text-[12px] text-navy-400 truncate">{guide.descriptionRu}</p>
          </div>
          <span className="text-2xl">{guide.icon}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-5 space-y-4">
        {guide.tipRu && (
          <Card variant="elevated" className="p-4 bg-lavender-600/15 border-lavender-500/30">
            <p className="text-[14px] text-lavender-100 leading-snug">{guide.tipRu}</p>
          </Card>
        )}

        <Card variant="elevated" className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-navy-400">Прогресс</span>
            <span className="text-[13px] font-semibold text-lavender-300">
              {completedCount}/{checklist.length}
            </span>
          </div>
          <div className="w-full h-2 bg-navy-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-lavender-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </Card>

        {groups.map((group) => (
          <Card key={group.phase} variant="elevated" className="p-4">
            <h3 className="text-[13px] font-bold uppercase tracking-wide text-lavender-400 mb-3">
              {group.phase === 'other'
                ? 'Действия'
                : phaseLabelRu[group.phase as keyof typeof phaseLabelRu]}
            </h3>
            <div className="space-y-2">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-xl border transition-all text-left ${
                    item.completed
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-[#1e1e24] border-lavender-500/25'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      item.completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-lavender-500/50'
                    }`}
                  >
                    {item.completed && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-[15px] font-medium ${
                        item.completed ? 'text-navy-400 line-through' : 'text-lavender-100'
                      }`}
                    >
                      {item.textRu}
                    </span>
                    {item.detailRu && (
                      <span
                        className={`block text-[13px] mt-1.5 leading-snug ${
                          item.completed ? 'text-navy-500' : 'text-navy-300'
                        }`}
                      >
                        {item.detailRu}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        ))}

        <Button
          variant="ghost"
          onClick={() => setChecklist(guide.checklist.map((item) => ({ ...item, completed: false })))}
        >
          Сбросить прогресс
        </Button>
      </main>
    </div>
  )
}
