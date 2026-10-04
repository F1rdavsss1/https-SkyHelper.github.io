import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { FileText, Search, Folder, BookOpen } from 'lucide-react'
import { knowledgeSections } from '../data/opsKnowledge'
import {
  petcSteps,
  remarks,
  seatLegend,
  weapSteps,
  wheelchairCodes,
} from '../data/opsKnowledge'

type DocArticle = {
  id: string
  folder: string
  nameRu: string
  name: string
  bodyRu: string
}

function buildArticles(): DocArticle[] {
  const seatsBody = seatLegend
    .map((s) => `• ${s.titleRu}\n  ${s.descriptionRu}`)
    .join('\n\n')

  const remarksBody = remarks.map((r) => `${r.code} — ${r.titleRu}\n${r.descriptionRu}`).join('\n\n')

  const wchBody = wheelchairCodes
    .map((w) => `${w.code}${w.phoneticRu ? ` (${w.phoneticRu})` : ''}\n${w.descriptionRu}`)
    .join('\n\n')

  const weapBody = weapSteps
    .map((s, i) => `${i + 1}. ${s.textRu}${s.detailRu ? `\n   ${s.detailRu}` : ''}`)
    .join('\n\n')

  const petcBody = petcSteps
    .map((s, i) => `${i + 1}. ${s.textRu}${s.detailRu ? `\n   ${s.detailRu}` : ''}`)
    .join('\n\n')

  return [
    {
      id: 'doc-seats',
      folder: 'Справочник',
      nameRu: 'Обозначение мест',
      name: 'Seat map colors',
      bodyRu: seatsBody,
    },
    {
      id: 'doc-remarks',
      folder: 'Справочник',
      nameRu: 'Ремарки SSR',
      name: 'SSR remarks',
      bodyRu: remarksBody,
    },
    {
      id: 'doc-wch',
      folder: 'Справочник',
      nameRu: 'Колясочники WCH*',
      name: 'Wheelchair codes',
      bodyRu: wchBody,
    },
    {
      id: 'doc-weap',
      folder: 'Процедуры',
      nameRu: 'Процедура WEAP (оружие)',
      name: 'WEAP checklist',
      bodyRu: weapBody,
    },
    {
      id: 'doc-petc',
      folder: 'Процедуры',
      nameRu: 'Процедура PETC (животное)',
      name: 'PETC checklist',
      bodyRu: petcBody,
    },
  ]
}

const articles = buildArticles()

export function Documents() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)

  const folders = Array.from(new Set(articles.map((doc) => doc.folder)))
  const filteredDocs = articles.filter(
    (doc) =>
      (selectedFolder ? doc.folder === selectedFolder : true) &&
      (doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.nameRu.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.folder.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.bodyRu.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const preview = articles.find((d) => d.id === previewId)

  if (preview) {
    return (
      <div className="min-h-dvh page-pad app-bg">
        <header className="sticky top-0 z-40 glass border-b border-lavender-500/25 safe-top">
          <div className="page-wrap py-3">
            <Button variant="ghost" size="sm" onClick={() => setPreviewId(null)}>
              ← Назад
            </Button>
            <h1 className="text-h2 text-lavender-100 mt-2">{preview.nameRu}</h1>
            <p className="text-caption text-navy-400">Открыто в приложении · {preview.folder}</p>
          </div>
        </header>
        <main className="page-wrap py-4 sm:py-6">
          <article className="rounded-2xl border border-lavender-500/30 bg-[#2a2a32] p-4 sm:p-6">
            <pre className="whitespace-pre-wrap break-words text-[14px] sm:text-[15px] leading-relaxed text-lavender-100 font-sans">
              {preview.bodyRu}
            </pre>
          </article>
          <Button className="mt-4 w-full sm:w-auto" variant="secondary" onClick={() => navigate('/knowledge')}>
            <BookOpen className="w-4 h-4 mr-2" />
            Открыть полный справочник
          </Button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh page-pad app-bg">
      <header className="sticky top-0 z-40 glass border-b border-lavender-500/25 safe-top">
        <div className="page-wrap py-3 sm:py-4">
          <h1 className="text-h1 text-lavender-200 mb-3">Документы</h1>
          <div className="relative">
            <Input
              placeholder="Поиск по тексту…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
          </div>
        </div>
      </header>

      <main className="page-wrap py-4 sm:py-5 space-y-5">
        <button
          type="button"
          onClick={() => navigate('/knowledge/airlines')}
          className="w-full text-left rounded-2xl border border-lavender-400/40 bg-lavender-600/15 p-4"
        >
          <div className="text-[15px] font-bold text-lavender-100">Памятки авиакомпаний LED</div>
          <p className="text-[13px] text-navy-300 mt-1">
            DP, SU/FV, HY, TK… — текст открывается сразу в приложении, без PDF
          </p>
        </button>

        <div className="grid gap-2 sm:grid-cols-2">
          {knowledgeSections.slice(0, 5).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => navigate(`/knowledge/${s.id}`)}
              className="text-left rounded-xl border border-lavender-500/25 bg-[#2a2a32] px-3 py-3"
            >
              <span className="mr-2">{s.icon}</span>
              <span className="text-[13px] font-semibold text-lavender-100">{s.titleRu}</span>
            </button>
          ))}
        </div>

        {!selectedFolder && !searchQuery && (
          <section>
            <h2 className="text-h2 text-lavender-200 mb-3">Папки</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {folders.map((folder) => {
                const count = articles.filter((doc) => doc.folder === folder).length
                return (
                  <Card
                    key={folder}
                    variant="elevated"
                    className="p-4 cursor-pointer active:scale-[0.99] transition-transform bg-[#2a2a32] border-lavender-500/30"
                    onClick={() => setSelectedFolder(folder)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-lavender-600/25 flex items-center justify-center">
                        <Folder className="w-5 h-5 text-lavender-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lavender-100 truncate">{folder}</h3>
                        <p className="text-caption text-navy-400">{count} материалов</p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        <section>
          {selectedFolder && (
            <div className="mb-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedFolder(null)}>
                ← Назад к папкам
              </Button>
              <h2 className="text-h2 text-lavender-200 mt-1">{selectedFolder}</h2>
            </div>
          )}

          <div className="space-y-2">
            {(selectedFolder || searchQuery ? filteredDocs : []).map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => setPreviewId(doc.id)}
                className="w-full text-left rounded-2xl border border-lavender-500/30 bg-[#2a2a32] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-lavender-600/25 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-lavender-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lavender-100 truncate">{doc.nameRu}</h3>
                    <p className="text-caption text-navy-400 truncate">{doc.name}</p>
                    <p className="text-[12px] text-lavender-400 mt-1">Открыть в приложении →</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {(selectedFolder || searchQuery) && filteredDocs.length === 0 && (
            <div className="text-center py-14">
              <FileText className="w-10 h-10 mx-auto text-navy-300 mb-3" />
              <h3 className="text-[16px] font-semibold mb-1 text-lavender-100">Ничего не найдено</h3>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
