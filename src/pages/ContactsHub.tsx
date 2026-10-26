import { useMemo, useState } from 'react'
import { AlertTriangle, Check, Copy, Phone, Radio, Search, ShieldAlert, X } from 'lucide-react'
import { Input } from '../components/ui/Input'
import { cn } from '../lib/utils'
import { pulkovoContactGroups, radioCalls, type PhoneValue, type PulkovoContact } from '../data/ops/pulkovoContacts'
import { MyContacts } from './Contacts'

type Tab = 'pulkovo' | 'mine'

function Tabs({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="mb-3 inline-flex rounded-xl bg-navy-900/60 border border-lavender-500/25 p-1">
      {(
        [
          ['pulkovo', 'Пулково'],
          ['mine', 'Мои контакты'],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors',
            tab === id ? 'bg-lavender-600 text-white' : 'text-navy-300 hover:text-lavender-200',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function ValueChip({ v }: { v: PhoneValue }) {
  const [copied, setCopied] = useState(false)
  const digits = v.text.match(/\d{4}/)?.[0]

  if (v.mobile) {
    return (
      <a
        href={`tel:+7${v.mobile.slice(1)}`}
        className="inline-flex items-center gap-1.5 rounded-lg bg-lavender-600/25 border border-lavender-500/40 px-2.5 py-1.5 text-[13.5px] font-semibold text-lavender-100 hover:bg-lavender-600/40"
      >
        <Phone className="w-3.5 h-3.5 text-lavender-300" />
        {v.text}
      </a>
    )
  }
  return (
    <button
      type="button"
      onClick={() => {
        if (!digits) return
        navigator.clipboard?.writeText(digits).then(
          () => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1200)
          },
          () => {},
        )
      }}
      title={digits ? 'Внутренний номер — нажмите, чтобы скопировать' : undefined}
      className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900/70 border border-lavender-500/25 px-2.5 py-1.5 font-mono text-[14px] font-bold tracking-wide text-lavender-50 hover:border-lavender-400/50"
    >
      {v.text}
      {digits && (copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 opacity-40" />)}
    </button>
  )
}

function ContactRow({ c }: { c: PulkovoContact }) {
  const sources = (v: PhoneValue) => v.sources.join(' + ')
  const mixed = new Set(c.values.map(sources)).size > 1
  return (
    <div className="px-4 py-3.5 space-y-2">
      <div>
        <div className="text-[15px] font-semibold text-lavender-100">{c.name}</div>
        {c.aka && <div className="text-[12px] text-navy-400">также: {c.aka.join(', ')}</div>}
      </div>
      <div className="flex flex-wrap gap-2">
        {c.values.map((v, i) => (
          <div key={i} className="flex flex-col items-start gap-0.5">
            <ValueChip v={v} />
            {mixed && <span className="text-[10.5px] text-navy-400 pl-1">{sources(v)}</span>}
          </div>
        ))}
      </div>
      {c.conflict && (
        <div className="flex gap-2 rounded-lg border border-amber-400/35 bg-amber-400/10 px-3 py-2 text-[12.5px] text-amber-50">
          <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <span>{c.conflict} Уточните у координатора.</span>
        </div>
      )}
      {c.note && <p className="text-[12.5px] text-navy-300">{c.note}</p>}
    </div>
  )
}

function PulkovoDirectory({ tabs }: { tabs: React.ReactNode }) {
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const groups = useMemo(
    () =>
      pulkovoContactGroups
        .map((g) => ({
          ...g,
          contacts: g.contacts.filter(
            (c) =>
              !query ||
              [c.name, ...(c.aka ?? []), c.note ?? '', ...c.values.map((v) => v.text + (v.mobile ?? ''))]
                .join(' ')
                .toLowerCase()
                .includes(query),
          ),
        }))
        .filter((g) => g.contacts.length),
    [query],
  )

  return (
    <div className="min-h-dvh page-pad app-bg">
      <header className="sticky top-0 z-40 glass border-b border-lavender-500/25 safe-top">
        <div className="page-wrap py-3 sm:py-4">
          <h1 className="text-h1 text-lavender-200 mb-3">Связь</h1>
          {tabs}
          <div className="relative">
            <Input
              placeholder="Служба или номер: центровка, 4285, медпункт…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-11 pr-10"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-navy-300"
                aria-label="Очистить"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="page-wrap py-4 sm:py-5 space-y-4">
        <div className="flex gap-2.5 rounded-xl border border-red-400/30 bg-red-400/10 px-3.5 py-2.5 text-[12.5px] text-red-100">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-300" />
          <span>
            Служебные номера — только для работы. Не передаём третьим лицам (памятка Пулково, «Безопасность данных»).
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 items-start">
          {groups.map((g) => (
            <section key={g.title} className="rounded-2xl border border-lavender-500/25 bg-[#2a2a32] overflow-hidden">
              <h2 className="flex items-center gap-2 px-4 pt-3.5 pb-1 text-[13px] font-semibold uppercase tracking-wider text-lavender-300">
                <span className="text-[16px]">{g.icon}</span>
                {g.title}
              </h2>
              <div className="divide-y divide-lavender-500/15">
                {g.contacts.map((c) => (
                  <ContactRow key={c.name} c={c} />
                ))}
              </div>
            </section>
          ))}
        </div>
        {!groups.length && <p className="text-center text-navy-400 py-10">Ничего не найдено</p>}

        {!query && (
          <section className="rounded-2xl border border-lavender-500/25 bg-[#2a2a32] p-4">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-lavender-300 mb-2">
              <Radio className="w-4 h-4" />
              По рации
            </h2>
            <ul className="space-y-1.5">
              {radioCalls.map((r) => (
                <li key={r.name} className="text-[14px] text-lavender-100">
                  <b>{r.name}</b> <span className="text-navy-300">— {r.note}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-[11.5px] text-navy-500">
          Источники: «список» — фото таблицы контактов от агентов; «буклет» — «Памятка для сотрудника ООО «ВВСС» по СПП», стр. 3
          и разделы буклета. Нажмите на внутренний номер, чтобы скопировать.
        </p>
      </main>
    </div>
  )
}

export function ContactsHub() {
  const [tab, setTab] = useState<Tab>('pulkovo')
  const tabs = <Tabs tab={tab} onChange={setTab} />
  return tab === 'pulkovo' ? <PulkovoDirectory tabs={tabs} /> : <MyContacts tabs={tabs} />
}
