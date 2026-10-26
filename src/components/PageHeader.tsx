import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/** Шапка вложенной страницы справочника: «назад», заголовок, подзаголовок */
export function PageHeader({ title, subtitle, back = '/knowledge', right }: { title: ReactNode; subtitle?: ReactNode; back?: string; right?: ReactNode }) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-40 glass border-b border-lavender-500/25 safe-top">
      <div className="page-wrap py-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(back)}
          className="touch-target flex items-center justify-center"
          aria-label="Назад"
        >
          <ArrowLeft className="w-5 h-5 text-lavender-200" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[16px] sm:text-[17px] font-semibold text-lavender-100 truncate">{title}</h1>
          {subtitle && <p className="text-[11.5px] text-navy-400 truncate">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  )
}
