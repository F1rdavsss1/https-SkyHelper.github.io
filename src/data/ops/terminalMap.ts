/**
 * Схема стоек регистрации (картинка, присланная агентом) — по порядку слева направо.
 * «island» — отдельный блок со стойками и подписью внизу (как на схеме: «1,2» и «106 A,B»).
 */
export type MapCell = { kind: 'desk'; label: string } | { kind: 'island'; label: string; sub: string }

export interface TerminalRow {
  terminal: string
  /** Стойки над основным рядом (на схеме МВЛ: 60, 61, 63) */
  top?: { label: string; col: number }[]
  cells: MapCell[]
}

const d = (label: string): MapCell => ({ kind: 'desk', label })
const i = (label: string, sub: string): MapCell => ({ kind: 'island', label, sub })

export const terminalMap: TerminalRow[] = [
  {
    terminal: 'Терминал ВВЛ',
    cells: [
      i('1, 2', '106 A, B'),
      d('3'),
      d('4'),
      i('5, 6', '107 A, B'),
      d('7'),
      d('8'),
      d('9'),
      d('10'),
      d('11'),
      i('12, 13', '108 A, B'),
      d('14'),
      d('15'),
      d('16'),
      // на схеме написано «17.18» — через точку
      i('17, 18', '109 A, B'),
    ],
  },
  {
    terminal: 'Терминал МВЛ',
    top: [
      { label: '60', col: 3 },
      { label: '61', col: 4 },
      { label: '63', col: 5 },
    ],
    cells: [
      i('50, 51', '105 B, A'),
      i('52, 53', '104 B, A'),
      i('54, 55', '103 B, A'),
      d('58'),
      d('59'),
      d('62'),
      i('64, 65', '102 B, A'),
    ],
  },
]
