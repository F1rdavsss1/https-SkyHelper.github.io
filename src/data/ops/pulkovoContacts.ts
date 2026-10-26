/**
 * Телефоны Пулково. Два источника:
 *  - «список» — фото таблицы контактов, присланное агентом;
 *  - «буклет» — «Памятка для сотрудника ООО «ВВСС» по СПП», стр. 3 и текст буклета.
 * Если источники расходятся — показываем оба значения с пометкой, ничего не выбираем за агента.
 */

export type ContactSource = 'список' | 'буклет' | 'инструкция посадки'

export interface PhoneValue {
  /** Как написано в источнике: «3761», «2399 (ВВЛ–ВВЛ)», «15…(15+№ выхода) — МВЛ» */
  text: string
  /** Мобильный номер для звонка (11 цифр) */
  mobile?: string
  sources: ContactSource[]
}

export interface PulkovoContact {
  name: string
  /** Другие названия той же службы в источниках */
  aka?: string[]
  values: PhoneValue[]
  note?: string
  /** Источники расходятся — показать предупреждение */
  conflict?: string
}

export interface ContactGroup {
  title: string
  icon: string
  contacts: PulkovoContact[]
}

const both: ContactSource[] = ['список', 'буклет']

export const pulkovoContactGroups: ContactGroup[] = [
  {
    title: 'Смена и координаторы',
    icon: '🧭',
    contacts: [
      {
        name: 'Начальник смены',
        values: [{ text: '3761', sources: both }, { text: 'м. 8 921 858-61-40', mobile: '89218586140', sources: both }],
      },
      {
        name: 'Координатор зоны регистрации',
        values: [{ text: '3097', sources: both }, { text: 'м. 8 921 593-77-18', mobile: '89215937718', sources: both }],
      },
      {
        name: 'Координатор зоны посадки',
        values: [
          { text: '2167', sources: ['список'] },
          { text: '4783', sources: ['буклет', 'инструкция посадки'] },
          { text: 'м. 8 921 593-77-35', mobile: '89215937735', sources: both },
        ],
        conflict: 'Внутренний номер разный: в списке 2167, в буклете и инструкции посадки — 4783 (47-83).',
      },
      {
        name: 'Инфо-центр (помощь)',
        values: [{ text: '3639 (36-39)', sources: ['буклет'] }],
        note: 'В буклете: «Форс-мажор — что делать? Звони 36-39».',
      },
      {
        name: 'IT (айтишники)',
        values: [{ text: '3691 или 4823', sources: both }, { text: 'м. 8 921 763-49-83', mobile: '89217634983', sources: both }],
      },
      { name: 'DCS', values: [{ text: '4781', sources: ['список'] }] },
    ],
  },
  {
    title: 'Регистрация и посадка',
    icon: '🧾',
    contacts: [
      { name: 'Стойки регистрации', values: [{ text: '11… (11 + № стойки)', sources: ['буклет'] }] },
      {
        name: 'Выход на посадку',
        values: [
          { text: '15… (15 + № выхода) — МВЛ', sources: both },
          { text: '16… (16 + № выхода) — ВВЛ', sources: both },
        ],
      },
      { name: 'Трансферная стойка МВЛ', values: [{ text: '2784', sources: ['список'] }] },
      {
        name: 'Трансферная стойка ВВЛ',
        values: [
          { text: '2399 (ВВЛ–ВВЛ)', sources: ['список'] },
          { text: '2778 (ВВЛ–МВЛ)', sources: ['список'] },
        ],
      },
      {
        name: 'Дикторская',
        values: [{ text: '3481', sources: [...both, 'инструкция посадки'] }, { text: '2658', sources: ['буклет'] }],
      },
      { name: 'Информация', values: [{ text: '2675', sources: ['буклет'] }] },
      { name: 'Касса', values: [{ text: '4272', sources: ['буклет'] }] },
      {
        name: 'Бизнес-салон',
        values: [
          { text: 'ВВЛ — 3505', sources: ['буклет'] },
          { text: 'МВЛ — 4786', sources: ['буклет'] },
          { text: 'Аэрофлот — 2091 или 2092', sources: ['буклет'] },
        ],
      },
      { name: 'VIP', values: [{ text: '2015 или 3446 или 3644', sources: both }] },
      { name: 'ЗОЛД', values: [{ text: '2363', sources: both }] },
    ],
  },
  {
    title: 'Багаж',
    icon: '🧳',
    contacts: [
      {
        name: 'Оператор BRS (комплектовка, compl. check)',
        values: [{ text: '2661 или 2662', sources: both }],
        note: 'Сюда же в буклете: номер бирки WEAP (26-61, 26-62), бирка и вес коляски — ведущему специалисту СОБТ 2661/2662.',
      },
      {
        name: 'Диспетчер багажа (снятие багажа)',
        values: [{ text: '2279', sources: [...both, 'инструкция посадки'] }, { text: '2280', sources: ['буклет'] }],
      },
      {
        name: 'Диспетчер по багажу ЦОУА',
        aka: ['Диспетчер багажа ЦД (список)'],
        values: [{ text: '4806', sources: both }],
      },
      { name: 'Оператор BHS (поломка ленты)', values: [{ text: '3480', sources: both }] },
      {
        name: 'Отдел розыска багажа',
        values: [
          { text: '2781', sources: ['список'] },
          { text: 'ВВЛ — 2781 или 2244', sources: ['буклет'] },
          { text: 'МВЛ — 2788 или 2464', sources: ['буклет'] },
        ],
      },
      { name: 'Стол находок', values: [{ text: '2787 или 2383', sources: ['буклет'] }] },
    ],
  },
  {
    title: 'Службы',
    icon: '🛡️',
    contacts: [
      {
        name: 'Центровка',
        values: [{ text: '4285', sources: both }, { text: '3762 (ОЦ СПО «42-85/37-62»)', sources: ['буклет'] }],
      },
      {
        name: 'Диспетчер ОДО (PRM + UM)',
        aka: ['Диспетчер ЦОУА (список)'],
        values: [{ text: '4761', sources: both }],
        conflict:
          'Один номер, разные названия: в буклете 4761 — «Диспетчер ОДО (PRM+UM)», в списке — «Диспетчер ЦОУА». А в разделе UM буклета сказано «сообщить диспетчеру ОДО 47-83».',
      },
      { name: 'PRM «Open space»', values: [{ text: '3773', sources: both }], note: 'В буклете (UM): «предупредить администратора 37-73».' },
      { name: 'Служба досмотра', values: [{ text: '4845', sources: ['буклет'] }] },
      {
        name: 'Пограничная служба',
        values: [{ text: '3518', sources: ['буклет'] }],
        note: 'Только согласовав с координатором.',
      },
      {
        name: 'Диспетчер СПК',
        values: [{ text: '4930 (49-30)', sources: ['буклет'] }],
        note: 'Неявка пассажира, сдавшего WEAP, — сообщить сразу.',
      },
      { name: 'Полиция', values: [{ text: '2202', sources: both }] },
      {
        name: 'Медпункт',
        values: [
          { text: '0303', sources: ['список'] },
          { text: '4265', sources: ['буклет'] },
          { text: 'м. 8 921 797-84-98', mobile: '89217978498', sources: ['буклет'] },
        ],
        conflict: 'Номер разный: в списке 0303, в буклете 4265 и мобильный.',
      },
      { name: 'Авиационная безопасность', values: [{ text: '2300', sources: both }] },
      { name: 'Пожарная безопасность', values: [{ text: '2001', sources: both }] },
      {
        name: 'Клининг',
        values: [
          { text: 'ЦПТ — 8 981 751-06-40', mobile: '89817510640', sources: ['список'] },
          { text: 'ВВЛ — 8 911 962-19-28', mobile: '89119621928', sources: ['список'] },
          { text: 'МВЛ — 8 981 751-10-50', mobile: '89817511050', sources: ['список'] },
          { text: 'м. 8 911 760-12-70', mobile: '89117601270', sources: ['буклет'] },
        ],
        conflict: 'В списке три номера по зонам, в буклете — один другой номер.',
      },
    ],
  },
]

export const radioCalls = [
  { name: '«Контроль 1»', note: 'итоговый доклад по посадке супервайзеру (буклет, стр. 34)' },
  { name: '«Россия»', note: 'то же — на а/к «Аэрофлот» (буклет, стр. 34)' },
  { name: 'Контроль стоянки (141) + город или АК', note: 'после отправки доков: total паксов (инструкция посадки)' },
]
