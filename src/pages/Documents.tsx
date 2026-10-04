import { useState } from 'react'
import { documents } from '../data/mockData'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { FileText, Search, Folder, Download, Eye } from 'lucide-react'

export function Documents() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)

  const folders = Array.from(new Set(documents.map((doc) => doc.folder)))
  const filteredDocs = documents.filter(
    (doc) =>
      (selectedFolder ? doc.folder === selectedFolder : true) &&
      (doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.nameRu.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.folder.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const preview = documents.find((d) => d.id === previewId)

  if (preview) {
    return (
      <div className="min-h-dvh page-pad app-bg">
        <header className="sticky top-0 z-40 glass border-b border-lavender-500/25 safe-top">
          <div className="page-wrap py-3">
            <Button variant="ghost" size="sm" onClick={() => setPreviewId(null)}>
              ← Назад
            </Button>
            <h1 className="text-h2 text-lavender-100 mt-2">{preview.nameRu}</h1>
            <p className="text-caption text-navy-400">
              {preview.type.toUpperCase()} · {formatFileSize(preview.size)}
            </p>
          </div>
        </header>
        <main className="page-wrap py-6">
          <Card variant="elevated" className="p-6 min-h-[420px] flex flex-col bg-[#2a2a32] border-lavender-500/30">
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <FileText className="w-14 h-14 text-lavender-400 mb-4" />
              <p className="text-[15px] text-navy-300 max-w-[260px]">
                Просмотр файла. Zoom и поиск по PDF — в следующей версии.
              </p>
              <p className="text-caption text-navy-400 mt-4">
                Автор: {preview.uploadedBy} ·{' '}
                {new Date(preview.uploadedAt).toLocaleDateString('ru-RU')}
              </p>
            </div>
            <div className="flex gap-2 mt-6">
              <Button className="flex-1" variant="secondary">
                <Download className="w-4 h-4 mr-2" />
                Offline
              </Button>
              <Button className="flex-1">Поделиться</Button>
            </div>
          </Card>
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
              placeholder="Поиск по названию…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
          </div>
        </div>
      </header>

      <main className="page-wrap py-4 sm:py-5">
        {!selectedFolder && !searchQuery && (
          <section className="mb-6">
            <h2 className="text-h2 text-lavender-200 mb-3">Папки</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {folders.map((folder) => {
                const count = documents.filter((doc) => doc.folder === folder).length
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
                        <p className="text-caption text-navy-400">{count} документов</p>
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
              <Card key={doc.id} variant="elevated" className="p-4 bg-[#2a2a32] border-lavender-500/30">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-lavender-600/25 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-lavender-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lavender-100 truncate">{doc.nameRu}</h3>
                    <p className="text-caption text-navy-400 truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[12px] text-navy-400">
                      <span>{formatFileSize(doc.size)}</span>
                      <span>·</span>
                      <span>{new Date(doc.uploadedAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setPreviewId(doc.id)}>
                    <Eye className="w-5 h-5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {(selectedFolder || searchQuery) && filteredDocs.length === 0 && (
            <div className="text-center py-14">
              <FileText className="w-10 h-10 mx-auto text-navy-300 mb-3" />
              <h3 className="text-[16px] font-semibold mb-1 text-lavender-100">Документы не найдены</h3>
              <p className="text-navy-500 text-[14px]">Измените запрос или папку</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
