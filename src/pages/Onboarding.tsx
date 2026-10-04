import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { FileText, Plane, Zap, CheckCircle2 } from 'lucide-react'

interface OnboardingProps {
  onComplete: () => void
}

const slides = [
  {
    icon: Plane,
    title: 'Вся информация о рейсе в одном месте',
    subtitle: 'Рейсы, гейты, стойки, посадка, документы и рабочая информация.',
  },
  {
    icon: Zap,
    title: 'Работайте быстрее',
    subtitle: 'Вбил номер рейса — за секунды видите статус, гейт и регистрацию.',
  },
  {
    icon: FileText,
    title: 'Важные документы всегда под рукой',
    subtitle: 'PDF, инструкции, памятки и контакты коллег — offline-ready.',
  },
  {
    icon: CheckCircle2,
    title: 'Готовы к работе',
    subtitle: 'Откройте смену и получайте критичные обновления в реальном времени.',
  },
]

export function Onboarding({ onComplete }: OnboardingProps) {
  const [index, setIndex] = useState(0)
  const slide = slides[index]
  const Icon = slide.icon
  const isLast = index === slides.length - 1

  return (
    <div className="min-h-dvh app-bg flex flex-col safe-top safe-bottom px-5 pb-6">
      <div className="flex justify-end pt-2 min-h-11">
        {!isLast && (
          <button
            onClick={onComplete}
            className="text-[15px] font-medium text-navy-400 touch-target px-2"
          >
            Пропустить
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center animate-in">
        <div className="w-28 h-28 rounded-[2rem] bg-lavender-100 dark:bg-lavender-900/40 flex items-center justify-center mb-10">
          <Icon className="w-12 h-12 text-lavender-600 dark:text-lavender-400" strokeWidth={1.75} />
        </div>
        <h2 className="text-h1 text-navy-800 dark:text-navy-50 mb-3 max-w-[300px]">{slide.title}</h2>
        <p className="text-body text-navy-500 dark:text-navy-400 max-w-[300px]">{slide.subtitle}</p>
      </div>

      <div className="flex items-center justify-center gap-2 mb-6">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? 'w-6 bg-lavender-600' : 'w-2 bg-lavender-200 dark:bg-navy-700'
            }`}
          />
        ))}
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={() => {
          if (isLast) onComplete()
          else setIndex((i) => i + 1)
        }}
      >
        {isLast ? 'Начать' : 'Далее'}
      </Button>
    </div>
  )
}
