/** Справочник агента: места, ремарки, коляски, процедуры */

export type SeatColorId =
  | 'free'
  | 'occupied'
  | 'paid'
  | 'hard_block'
  | 'soft_block'
  | 'preseat'
  | 'infant_mark'

export interface SeatLegendItem {
  id: SeatColorId
  titleRu: string
  color: string
  border?: string
  mark?: 'orange-triangle'
  descriptionRu: string
}

export interface RemarkItem {
  code: string
  titleRu: string
  descriptionRu: string
  group: 'pax' | 'infant' | 'pet' | 'medical' | 'baggage' | 'security' | 'service' | 'other'
}

export interface WheelchairCode {
  code: string
  phoneticRu: string
  descriptionRu: string
}

export interface ProcedureStep {
  id: string
  textRu: string
  detailRu?: string
}

export const seatLegend: SeatLegendItem[] = [
  {
    id: 'free',
    titleRu: 'Серые — свободные',
    color: '#9ca3af',
    descriptionRu: 'Место свободно, можно назначить пассажиру.',
  },
  {
    id: 'occupied',
    titleRu: 'Голубые — занято',
    color: '#60a5fa',
    descriptionRu: 'Место уже занято другим пассажиром.',
  },
  {
    id: 'paid',
    titleRu: 'Тёмно-зелёные — выкупленные',
    color: '#166534',
    descriptionRu: 'Платное / заранее выкупленное место.',
  },
  {
    id: 'hard_block',
    titleRu: 'Тёмно-серые / коричневые — жёсткий блок',
    color: '#57534e',
    descriptionRu: 'Заблокировано центровкой (закрытые центровкой). На регистрации не открывать без согласования.',
  },
  {
    id: 'soft_block',
    titleRu: 'Серые с жёлтой рамкой — мягкий блок',
    color: '#9ca3af',
    border: '#eab308',
    descriptionRu: 'Мягкий блок: доступны на регистрации при необходимости.',
  },
  {
    id: 'preseat',
    titleRu: 'Серые с зелёной рамкой — преситы',
    color: '#9ca3af',
    border: '#22c55e',
    descriptionRu: 'Мягкий блок для конкретных людей (preseat). Не отдавать «чужому» пассажиру.',
  },
  {
    id: 'infant_mark',
    titleRu: 'Оранжевый треугольник снизу',
    color: '#9ca3af',
    mark: 'orange-triangle',
    descriptionRu: 'Пассажир с младенцем (INF). Следить за рассадкой и люлькой BSCT.',
  },
]

export const remarks: RemarkItem[] = [
  { code: 'ВЗ', titleRu: 'Взрослый', descriptionRu: 'Тип пассажира: взрослый.', group: 'pax' },
  { code: 'РБ', titleRu: 'Ребёнок', descriptionRu: 'Тип пассажира: ребёнок (локальное обозначение).', group: 'pax' },
  { code: 'РМ', titleRu: 'Ребёнок/младенец (лок.)', descriptionRu: 'Тип пассажира по локальной классификации смены.', group: 'pax' },
  { code: 'INF', titleRu: 'Младенец', descriptionRu: 'Infant — младенец до 2 лет, без отдельного места (если не выкуплено).', group: 'infant' },
  { code: 'BSCT', titleRu: 'Люлька', descriptionRu: 'Bassinet — люлька для младенца. Место только где разрешена люлька.', group: 'infant' },
  { code: 'CHD', titleRu: 'Ребёнок 2–11', descriptionRu: 'Child — ребёнок от 2 до 11 лет.', group: 'pax' },
  {
    code: 'UNMR',
    titleRu: 'УМКА / без сопровождения',
    descriptionRu: 'Unaccompanied Minor — несовершеннолетний без сопровождения взрослых.',
    group: 'pax',
  },
  {
    code: 'EXST',
    titleRu: 'Пустое место рядом',
    descriptionRu: 'Extra seat — выкупленное пустое место рядом. На посадочном может отображаться как 1 A-B.',
    group: 'service',
  },
  { code: 'PETC', titleRu: 'Животное в салоне', descriptionRu: 'Pet in cabin — животное в салоне в переноске.', group: 'pet' },
  { code: 'AVIH', titleRu: 'Животное в багаже', descriptionRu: 'Animal in hold — животное в багажном отсеке.', group: 'pet' },
  { code: 'STCR', titleRu: 'Носилки', descriptionRu: 'Stretcher — больной пассажир на носилках.', group: 'medical' },
  { code: 'BLND', titleRu: 'Слепой пассажир', descriptionRu: 'Blind passenger — требуется сопровождение/помощь.', group: 'medical' },
  {
    code: 'DPNA',
    titleRu: 'Отклонения в развитии',
    descriptionRu: 'Passenger with intellectual/developmental disability — нужна особая помощь.',
    group: 'medical',
  },
  { code: 'DEAF', titleRu: 'Глухой пассажир', descriptionRu: 'Deaf passenger — учитывать при объявлениях/сопровождении.', group: 'medical' },
  {
    code: 'CBBG',
    titleRu: 'Доп. место багажа',
    descriptionRu: 'Cabin baggage seat — дополнительное место багажа рядом с пассажиром.',
    group: 'baggage',
  },
  { code: 'WEAP', titleRu: 'Оружие', descriptionRu: 'Weapon — оружие в багаже по процедуре (см. чеклист WEAP).', group: 'security' },
  {
    code: 'PREG',
    titleRu: 'Беременность',
    descriptionRu: 'Pregnant — беременные (после 28 недели — по правилам АК, часто нужна справка).',
    group: 'medical',
  },
  {
    code: 'JMP',
    titleRu: 'Откидное место',
    descriptionRu: 'Jump seat — откидное место. Ремарка, когда вместо обычного места нужен JMP для служебного пассажира.',
    group: 'service',
  },
  { code: 'WCHC', titleRu: 'Коляска Charlie', descriptionRu: 'См. раздел «Колясочники».', group: 'medical' },
  { code: 'WCHS', titleRu: 'Коляска Sierra', descriptionRu: 'См. раздел «Колясочники».', group: 'medical' },
  { code: 'WCHR', titleRu: 'Коляска Romeo', descriptionRu: 'См. раздел «Колясочники».', group: 'medical' },
  { code: 'WCMP', titleRu: 'Мех. кресло', descriptionRu: 'Своё механическое инвалидное кресло.', group: 'medical' },
  { code: 'WCBD', titleRu: 'Сухая батарея', descriptionRu: 'Кресло на сухой электрической батарее.', group: 'medical' },
  { code: 'WCBW', titleRu: 'Жидкий электролит', descriptionRu: 'Кресло на батарее с жидким электролитом.', group: 'medical' },
]

export const wheelchairCodes: WheelchairCode[] = [
  {
    code: 'WCHC',
    phoneticRu: 'Чарли',
    descriptionRu:
      'Пассажир не может самостоятельно передвигаться. Нужна кресло-коляска по перрону и в салоне самолёта.',
  },
  {
    code: 'WCHS',
    phoneticRu: 'Сиерра',
    descriptionRu:
      'Не может подниматься/спускаться по трапу, но сам доходит до места в салоне. Коляска — от/до ВС или галереи.',
  },
  {
    code: 'WCHR',
    phoneticRu: 'Ромео',
    descriptionRu:
      'Коляска нужна при движении до/от самолёта; по трапу поднимается/спускается самостоятельно.',
  },
  {
    code: 'WCMP',
    phoneticRu: '',
    descriptionRu: 'Пассажир путешествует со своим механическим инвалидным креслом.',
  },
  {
    code: 'WCBD',
    phoneticRu: '',
    descriptionRu: 'Инвалидное кресло на сухой электрической батарее.',
  },
  {
    code: 'WCBW',
    phoneticRu: '',
    descriptionRu: 'Инвалидное кресло на батарее с жидким электролитом.',
  },
]

export const weapSteps: ProcedureStep[] = [
  { id: 'w1', textRu: 'Пассажир подходит с сотрудником досмотра' },
  {
    id: 'w2',
    textRu: 'Взвесить и занести в систему оружие + патроны (если есть)',
    detailRu: 'Патроны идут бесплатно дополнительно к оружию.',
  },
  { id: 'w3', textRu: 'Отдать бирки досмотру' },
  { id: 'w4', textRu: 'Позвонить в центровку и багажку' },
  {
    id: 'w5',
    textRu: 'Проверить основание бесплатной перевозки',
    detailRu:
      'WEAP можно провозить бесплатно только при документах о командировке и т.п. Иначе — по тарифу АК.',
  },
]

export const petcSteps: ProcedureStep[] = [
  { id: 'p1', textRu: 'Проверить ремарку PETC в брони' },
  { id: 'p2', textRu: 'Проверить паспорт животного / ветдокументы' },
  {
    id: 'p3',
    textRu: 'МВЛ: печать «Выпуск разрешён…»',
    detailRu: 'Если печати нет — направить на ветконтроль (1 этаж).',
  },
  {
    id: 'p4',
    textRu: 'Проверить переноску по требованиям авиакомпании',
    detailRu: 'В жёстких переносках всегда измерять габариты.',
  },
  { id: 'p5', textRu: 'Проверить / принять оплату перевозки' },
  {
    id: 'p6',
    textRu: 'Следить за рассадкой',
    detailRu:
      'Длинный корешок сначала — прямая посадка. Два коротких сначала — обратная.',
  },
]

export const knowledgeSections = [
  {
    id: 'seats',
    titleRu: 'Обозначение мест',
    descriptionRu: 'Цвета карты мест, мягкий/жёсткий блок, младенец',
    icon: '💺',
  },
  {
    id: 'remarks',
    titleRu: 'Ремарки SSR',
    descriptionRu: 'INF, CHD, UNMR, PETC, WEAP, EXST и др.',
    icon: '🏷️',
  },
  {
    id: 'wheelchair',
    titleRu: 'Колясочники',
    descriptionRu: 'WCHC / WCHS / WCHR / WCMP / WCBD / WCBW',
    icon: '♿',
  },
  {
    id: 'weap',
    titleRu: 'Процедура WEAP',
    descriptionRu: 'Оружие и патроны на регистрации',
    icon: '🔫',
  },
  {
    id: 'petc',
    titleRu: 'Процедура PETC',
    descriptionRu: 'Животное в салоне — пошагово',
    icon: '🐕',
  },
  {
    id: 'airlines',
    titleRu: 'Памятки авиакомпаний',
    descriptionRu: 'Тексты памяток LED — открываются в приложении',
    icon: '✈️',
  },
] as const

export type KnowledgeSectionId = (typeof knowledgeSections)[number]['id']
