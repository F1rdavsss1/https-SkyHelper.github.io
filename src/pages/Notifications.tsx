import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Plane, DoorOpen, FileText, Trash2 } from 'lucide-react'
import { useNotifications } from '../context/NotificationsContext'
import { Button } from '../components/ui/Button'
import { formatDateTime } from '../lib/utils'
import type { Notification } from '../types'

function iconFor(type: Notification['type']) {
  switch (type) {
    case 'gate':
      return DoorOpen
    case 'boarding':
    case 'flight':
      return Plane
    case 'document':
      return FileText
    default:
      return Bell
  }
}

export function Notifications() {
  const navigate = useNavigate()
  const { notifications, markRead, markAllRead, remove } = useNotifications()

  return (
    <div className="min-h-dvh page-pad app-bg">
      <header className="sticky top-0 z-40 glass border-b border-lavender-500/25 safe-top">
        <div className="page-wrap py-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="touch-target flex items-center justify-center"
            aria-label="Назад"
          >
            <ArrowLeft className="w-5 h-5 text-lavender-200" />
          </button>
          <h1 className="text-[17px] font-semibold text-navy-800 dark:text-navy-100">Уведомления</h1>
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            Прочитать
          </Button>
        </div>
      </header>

      <main className="page-wrap py-4 space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-10 h-10 mx-auto text-navy-300 mb-3" />
            <p className="text-navy-500">Нет уведомлений</p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = iconFor(n.type)
            return (
              <div
                key={n.id}
                className={`rounded-2xl border p-4 flex gap-3 ${
                  n.read
                    ? 'bg-white dark:bg-navy-800 border-lavender-200 dark:border-navy-700'
                    : 'bg-lavender-50 dark:bg-lavender-900/20 border-lavender-300 dark:border-lavender-800'
                }`}
                onClick={() => markRead(n.id)}
              >
                <div className="w-10 h-10 rounded-xl bg-lavender-100 dark:bg-lavender-900/40 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-lavender-600 dark:text-lavender-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[15px] font-semibold text-navy-800 dark:text-navy-100">
                      {n.titleRu}
                    </h3>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-lavender-500 mt-1.5 shrink-0" />}
                  </div>
                  <p className="text-[14px] text-navy-500 dark:text-navy-400 mt-0.5">{n.messageRu}</p>
                  <p className="text-[12px] text-navy-400 mt-1.5">{formatDateTime(n.timestamp)}</p>
                </div>
                <button
                  type="button"
                  className="touch-target flex items-start justify-center pt-1 text-navy-300 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation()
                    remove(n.id)
                  }}
                  aria-label="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })
        )}
      </main>
    </div>
  )
}
