import { PageHeader } from '../components/PageHeader'
import { terminalMap, type MapCell } from '../data/ops/terminalMap'
import { cn } from '../lib/utils'

function Cell({ cell }: { cell: MapCell }) {
  if (cell.kind === 'desk') {
    return (
      <div className="flex items-start justify-center pt-2 text-[14px] sm:text-[15px] font-bold text-lavender-100 tabular-nums">
        {cell.label}
      </div>
    )
  }
  return (
    <div className="flex flex-col justify-between rounded-lg border border-lavender-400/50 bg-lavender-600/25 px-1 py-2 min-h-[92px] text-center">
      <div className="text-[14px] sm:text-[16px] font-bold text-white tabular-nums leading-tight">{cell.label}</div>
      <div className="text-[10.5px] sm:text-[11.5px] text-lavender-200 tabular-nums">{cell.sub}</div>
    </div>
  )
}

export function TerminalMapPage() {
  return (
    <div className="min-h-dvh page-pad app-bg">
      <PageHeader title="🗺️ Схема стоек" subtitle="Терминалы ВВЛ и МВЛ — по схеме от агентов" />
      <main className="page-wrap py-4 space-y-5">
        {terminalMap.map((row) => (
          <section key={row.terminal} className="rounded-2xl border border-lavender-500/25 bg-[#2a2a32] p-3 sm:p-4">
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                {row.top && (
                  <div
                    className="grid gap-1.5 mb-1.5"
                    style={{ gridTemplateColumns: `repeat(${row.cells.length}, minmax(0, 1fr))` }}
                  >
                    {row.cells.map((_, i) => {
                      const t = row.top?.find((x) => x.col === i)
                      return t ? (
                        <div
                          key={i}
                          className="rounded-lg border border-lavender-500/40 bg-navy-900/50 py-2 text-center text-[15px] font-bold text-lavender-100"
                        >
                          {t.label}
                        </div>
                      ) : (
                        <div key={i} />
                      )
                    })}
                  </div>
                )}
                <div className="rounded-lg bg-lavender-600 py-2 text-center text-[16px] font-bold text-white mb-1.5">
                  {row.terminal}
                </div>
                <div
                  className={cn('grid gap-1.5')}
                  style={{ gridTemplateColumns: `repeat(${row.cells.length}, minmax(0, 1fr))` }}
                >
                  {row.cells.map((c, i) => (
                    <Cell key={i} cell={c} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}
        <div className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-3.5 py-3 text-[12.5px] text-sky-50 space-y-1">
          <p>
            Крупные цифры — номера стоек. В рамке — блок стоек; подпись внизу блока перенесена со схемы как есть (например,
            «106 A, B»).
          </p>
          <p>На схеме у последнего блока ВВЛ написано «17.18» — здесь показано как «17, 18».</p>
        </div>
      </main>
    </div>
  )
}
