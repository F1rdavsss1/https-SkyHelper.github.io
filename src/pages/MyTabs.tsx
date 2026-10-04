import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, GripVertical, FileText, CheckSquare, Link2, Table } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import type { CustomTab } from '../types'

const STORAGE_KEY = 'aerodesk_tabs'

function loadTabs(): CustomTab[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CustomTab[]
    return parsed.map((t) => ({ ...t, createdAt: new Date(t.createdAt) }))
  } catch {
    return []
  }
}

export function MyTabs() {
  const navigate = useNavigate()
  const [tabs, setTabs] = useState<CustomTab[]>(() => loadTabs())
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs))
  }, [tabs])

  const create = () => {
    if (!title.trim()) return
    setTabs((prev) => [
      ...prev,
      {
        id: `t-${Date.now()}`,
        title: title,
        titleRu: title,
        icon: 'text',
        type: 'text',
        content: null,
        access: 'private',
        createdBy: 'local',
        createdAt: new Date(),
        order: prev.length,
      },
    ])
    setTitle('')
    setCreating(false)
  }

  return (
    <div className="min-h-dvh page-pad app-bg">
      <header className="sticky top-0 z-40 glass border-b border-lavender-500/25 safe-top">
        <div className="page-wrap py-2 flex items-center justify-between">
          <button type="button" onClick={() => navigate(-1)} className="touch-target flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-lavender-300" />
          </button>
          <h1 className="text-[17px] font-semibold text-lavender-200">Мои вкладки</h1>
          <button type="button" onClick={() => setCreating(true)} className="touch-target flex items-center justify-center">
            <Plus className="w-5 h-5 text-lavender-400" />
          </button>
        </div>
      </header>

      <main className="page-wrap py-4 sm:py-5 space-y-3">
        {creating && (
          <Card variant="elevated" className="p-4 space-y-3 bg-[#2a2a32] border-lavender-500/30 animate-in">
            <Input label="Название" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Новая вкладка" />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={create}>
                Создать
              </Button>
              <Button variant="ghost" onClick={() => setCreating(false)}>
                Отмена
              </Button>
            </div>
          </Card>
        )}

        {tabs.map((tab) => {
          const Icon =
            tab.type === 'checklist' ? CheckSquare : tab.type === 'links' ? Link2 : tab.type === 'table' ? Table : FileText
          return (
            <Card key={tab.id} variant="elevated" className="p-4 flex items-center gap-3 bg-[#2a2a32] border-lavender-500/30">
              <GripVertical className="w-4 h-4 text-navy-500 shrink-0" />
              <div className="w-10 h-10 rounded-xl bg-lavender-600/25 flex items-center justify-center">
                <Icon className="w-5 h-5 text-lavender-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-lavender-100 truncate">{tab.titleRu}</div>
                <div className="text-caption text-navy-400">
                  {tab.access === 'private' ? 'Только я' : tab.access === 'shift' ? 'Моя смена' : 'Все'} · {tab.type}
                </div>
              </div>
            </Card>
          )
        })}

        {tabs.length === 0 && !creating && (
          <div className="text-center py-12 text-navy-400 text-[14px]">
            Вкладок пока нет — создайте свою
          </div>
        )}

        {!creating && (
          <Button variant="secondary" className="w-full" onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Создать вкладку
          </Button>
        )}
      </main>
    </div>
  )
}
