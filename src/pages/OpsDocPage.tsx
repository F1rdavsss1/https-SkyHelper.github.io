import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Legend, SectionsReader } from '../components/guide/GuideBlocks'
import { parseGuide, type GuideSection, type RawBlock } from '../lib/airlineGuide'
import { parseDsl } from '../lib/opsDsl'
import { dslDocs, fileDocsMeta } from '../data/ops/catalog'

export interface FileDoc {
  id: string
  titleRu: string
  fileName: string
  bodyRu: string
  blocks: RawBlock[]
}

let fileDocsCache: Promise<FileDoc[]> | null = null
export function loadFileDocs(): Promise<FileDoc[]> {
  fileDocsCache ??= fetch('/ops/ops-docs.json', { cache: 'no-cache' })
    .then((r) => r.json())
    .then((d: { docs: FileDoc[] }) => d.docs ?? [])
    .catch(() => {
      fileDocsCache = null
      return []
    })
  return fileDocsCache
}

export function OpsDocPage() {
  const { docId } = useParams<{ docId: string }>()
  const [params] = useSearchParams()
  const dsl = dslDocs.find((d) => d.id === docId)
  const [fileDoc, setFileDoc] = useState<FileDoc | null | undefined>(undefined)

  useEffect(() => {
    if (dsl) return
    let alive = true
    loadFileDocs().then((docs) => {
      if (alive) setFileDoc(docs.find((d) => d.id === docId) ?? null)
    })
    return () => {
      alive = false
    }
  }, [docId, dsl])

  const sections: GuideSection[] = useMemo(() => {
    if (dsl) return parseDsl(dsl.text)
    if (fileDoc) return parseGuide(fileDoc.blocks).sections
    return []
  }, [dsl, fileDoc])

  const title = dsl?.title ?? fileDoc?.titleRu ?? 'Справочник'
  const icon = dsl?.icon ?? (docId ? fileDocsMeta[docId]?.icon : undefined) ?? '📄'
  const source = dsl?.source ?? (fileDoc ? `Файл «${fileDoc.fileName}»` : undefined)

  return (
    <div className="min-h-dvh page-pad app-bg">
      <PageHeader title={`${icon} ${title}`} subtitle={source} />
      <main className="page-wrap py-4 space-y-4">
        {!dsl && fileDoc === undefined && <p className="text-[13px] text-navy-400">Загрузка…</p>}
        {!dsl && fileDoc === null && <p className="text-center text-navy-400 py-10">Раздел не найден</p>}
        {sections.length > 0 && (
          <>
            <Legend />
            <SectionsReader
              key={docId}
              sections={sections}
              initialQuery={params.get('q') ?? ''}
              placeholder="Найти в разделе…"
            />
            {source && (
              <footer className="flex gap-2.5 rounded-xl border border-lavender-500/15 px-3.5 py-3 text-[12px] text-navy-400">
                <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Источник: {source}</span>
              </footer>
            )}
          </>
        )}
      </main>
    </div>
  )
}
