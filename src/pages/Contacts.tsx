import { useMemo, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { useContacts } from '../context/ContactsContext'
import { Search, Phone, MessageSquare, Copy, Plus, Trash2, X } from 'lucide-react'
import type { Contact } from '../types'

const emptyForm = {
  name: '',
  position: '',
  shift: '',
  phone: '',
  email: '',
  status: 'on_shift' as Contact['status'],
  airline: '',
}

export function Contacts() {
  const { contacts, addContact, removeContact, updateContact } = useContacts()
  const [searchQuery, setSearchQuery] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const filteredContacts = useMemo(
    () =>
      contacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phone.includes(searchQuery)
      ),
    [contacts, searchQuery]
  )

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone.replace(/\s/g, '')}`
  }

  const handleCopy = async (phone: string) => {
    await navigator.clipboard.writeText(phone)
    setCopied(phone)
    setTimeout(() => setCopied(null), 1500)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Укажите имя и телефон')
      return
    }
    addContact({
      name: form.name.trim(),
      position: form.position.trim() || 'Сотрудник',
      shift: form.shift.trim() || '—',
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      status: form.status,
      airline: form.airline.trim() || undefined,
    })
    setForm(emptyForm)
    setError(null)
    setShowForm(false)
  }

  return (
    <div className="min-h-dvh page-pad app-bg">
      <header className="sticky top-0 z-40 glass border-b border-lavender-500/25 safe-top">
        <div className="page-wrap py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h1 className="text-h1 text-lavender-200">Контакты</h1>
            <Button
              size="sm"
              onClick={() => {
                setShowForm((v) => !v)
                setError(null)
              }}
            >
              {showForm ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              {showForm ? 'Закрыть' : 'Добавить'}
            </Button>
          </div>
          <div className="relative">
            <Input
              placeholder="Поиск по имени, должности…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
          </div>
        </div>
      </header>

      <main className="page-wrap py-4 sm:py-5 space-y-4">
        {showForm && (
          <Card variant="elevated" className="p-4 bg-[#2a2a32] border-lavender-500/30 animate-in">
            <h2 className="text-[15px] font-semibold text-lavender-200 mb-3">Новый контакт</h2>
            <form onSubmit={submit} className="space-y-3">
              <Input
                label="ФИО *"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Иванова Анна"
              />
              <Input
                label="Телефон *"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+7 999 123-45-67"
                inputMode="tel"
              />
              <Input
                label="Должность"
                value={form.position}
                onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                placeholder="Агент регистрации"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Смена"
                  value={form.shift}
                  onChange={(e) => setForm((f) => ({ ...f, shift: e.target.value }))}
                  placeholder="06:00–18:00"
                />
                <Input
                  label="АК"
                  value={form.airline}
                  onChange={(e) => setForm((f) => ({ ...f, airline: e.target.value.toUpperCase() }))}
                  placeholder="DP"
                />
              </div>
              <Input
                label="Email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="optional@mail.ru"
                type="email"
              />
              <div>
                <p className="text-sm font-medium text-lavender-300 mb-2">Статус</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, status: 'on_shift' }))}
                    className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold border ${
                      form.status === 'on_shift'
                        ? 'bg-lavender-600 text-white border-lavender-500'
                        : 'bg-[#1e1e24] text-lavender-200 border-lavender-500/30'
                    }`}
                  >
                    На смене
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, status: 'off_shift' }))}
                    className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold border ${
                      form.status === 'off_shift'
                        ? 'bg-lavender-600 text-white border-lavender-500'
                        : 'bg-[#1e1e24] text-lavender-200 border-lavender-500/30'
                    }`}
                  >
                    Не на смене
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" className="w-full">
                Сохранить контакт
              </Button>
            </form>
          </Card>
        )}

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} variant="elevated" className="p-4 bg-[#2a2a32] border-lavender-500/30 min-w-0">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-lavender-600/30 flex items-center justify-center shrink-0">
                  <span className="text-[16px] font-semibold text-lavender-200">
                    {contact.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <h3 className="font-semibold text-[15px] text-lavender-100 leading-snug break-words">
                      {contact.name}
                    </h3>
                    <Badge variant={contact.status === 'on_shift' ? 'success' : 'neutral'} className="shrink-0">
                      {contact.status === 'on_shift' ? '● Смена' : 'Off'}
                    </Badge>
                  </div>
                  <p className="text-[13px] text-navy-400">{contact.position}</p>
                  <p className="text-[12px] text-navy-500 mt-0.5">
                    Смена: {contact.shift}
                    {contact.airline ? ` · ${contact.airline}` : ''}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-[14px] font-medium text-lavender-100">{contact.phone}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(contact.phone)}
                      className="touch-target flex items-center justify-center text-navy-400"
                      aria-label="Копировать"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {copied === contact.phone && (
                      <span className="text-[11px] text-green-400">Скопировано</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-lavender-500/20">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1 min-w-[7rem]"
                  onClick={() => handleCall(contact.phone)}
                >
                  <Phone className="w-4 h-4 mr-1.5" />
                  Позвонить
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 min-w-[5rem]"
                  onClick={() => {
                    window.location.href = `sms:${contact.phone.replace(/\s/g, '')}`
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  SMS
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-3 text-red-400"
                  onClick={() => {
                    if (confirm(`Удалить ${contact.name}?`)) removeContact(contact.id)
                  }}
                  aria-label="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <button
                type="button"
                className="mt-2 text-[12px] text-lavender-400"
                onClick={() =>
                  updateContact(contact.id, {
                    status: contact.status === 'on_shift' ? 'off_shift' : 'on_shift',
                  })
                }
              >
                {contact.status === 'on_shift' ? 'Отметить «не на смене»' : 'Отметить «на смене»'}
              </button>
            </Card>
          ))}
        </div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-14 rounded-2xl border border-lavender-500/20 bg-[#2a2a32]">
            <p className="text-[16px] font-semibold text-lavender-100 mb-1">
              {contacts.length === 0 ? 'Контактов пока нет' : 'Ничего не найдено'}
            </p>
            <p className="text-navy-400 text-[14px] mb-4">
              {contacts.length === 0
                ? 'Добавьте коллег — ФИО, телефон, смену'
                : 'Измените поиск'}
            </p>
            {contacts.length === 0 && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Добавить контакт
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
