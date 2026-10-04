import { useNavigate } from 'react-router-dom'
import { specialPassengerGuides } from '../data/mockData'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ArrowLeft, ChevronRight } from 'lucide-react'

export function SpecialPassengers() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh page-pad app-bg">
      <header className="sticky top-0 z-40 glass border-b border-lavender-500/25 safe-top">
        <div className="page-wrap py-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="touch-target flex items-center justify-center"
            aria-label="Назад"
          >
            <ArrowLeft className="w-5 h-5 text-lavender-200" />
          </button>
          <h1 className="text-[17px] font-semibold text-lavender-100">
            Особые пассажиры
          </h1>
        </div>
      </header>

      <main className="page-wrap py-5 grid gap-3 sm:grid-cols-2">
        {specialPassengerGuides.map((guide) => (
          <Card
            key={guide.id}
            variant="elevated"
            className="p-4 cursor-pointer active:scale-[0.99] transition-transform bg-[#2a2a32] border-lavender-500/30"
            onClick={() => navigate(`/special-passengers/${guide.id}`)}
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl bg-lavender-600/25 shrink-0">
                {guide.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-semibold text-lavender-100">
                  {guide.titleRu}
                </h3>
                <p className="text-[13px] text-navy-400 mt-0.5 line-clamp-2">
                  {guide.descriptionRu}
                </p>
                <p className="text-[12px] text-lavender-400 mt-1">
                  {guide.checklist.length} шагов · до стойки → гейт
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/special-passengers/${guide.id}`)
                  }}
                >
                  Открыть памятку
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </main>
    </div>
  )
}
