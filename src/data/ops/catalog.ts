import type { OpsDoc } from '../../lib/opsDsl'
import { airlineCompare, astraHowTo, boardingActions, boardingDocs, tagWinding, wrapFilm } from './agentDocs'
import {
  pmAnimals,
  pmBaggage,
  pmBoarding,
  pmCentrovka,
  pmDocuments,
  pmEmd,
  pmPrm,
  pmRemarks,
  pmRules,
} from './pulkovoBooklet'

/** Разделы, набранные в формате opsDsl */
export const dslDocs: OpsDoc[] = [
  boardingActions,
  boardingDocs,
  astraHowTo,
  airlineCompare,
  tagWinding,
  wrapFilm,
  pmRemarks,
  pmPrm,
  pmCentrovka,
  pmEmd,
  pmBaggage,
  pmAnimals,
  pmDocuments,
  pmRules,
  pmBoarding,
]

/** Разделы из .docx (public/ops/ops-docs.json, импорт scripts/import_pulkovo.py) */
export const fileDocsMeta: Record<string, { icon: string; description: string }> = {
  vocabulary: { icon: '🗣️', description: 'Фразы на английском: регистрация, паспорт и виза, билеты, багаж, посадка' },
  'avih-checklist': { icon: '🐕', description: 'Готовая памятка: что проверить и кому сообщить при AVIH' },
  'amadeus-test': { icon: '🎓', description: 'Вопросы для проверки знаний по Amadeus Altea — для самопроверки' },
}

export interface HubItem {
  title: string
  icon: string
  description: string
  to: string
}

const doc = (d: OpsDoc): HubItem => ({ title: d.title, icon: d.icon, description: d.description, to: `/knowledge/doc/${d.id}` })
const file = (id: string, title: string): HubItem => ({ title, ...fileDocsMeta[id], to: `/knowledge/doc/${id}` })

export const hubGroups: { title: string; items: HubItem[] }[] = [
  {
    title: 'Смена: посадка и Astra',
    items: [
      doc(boardingActions),
      doc(boardingDocs),
      doc(pmBoarding),
      doc(astraHowTo),
      doc(tagWinding),
    ],
  },
  {
    title: 'Авиакомпании',
    items: [
      { title: 'Памятки авиакомпаний', icon: '✈️', description: 'Все памятки LED: Word, Excel, PDF и скан', to: '/knowledge/airlines' },
      doc(airlineCompare),
      { title: 'Коды авиакомпаний', icon: '🔤', description: '2S, 3F, 5N … ZF — с переходом к памятке', to: '/knowledge/codes' },
    ],
  },
  {
    title: 'Пассажиры и ремарки',
    items: [
      { title: 'Ремарки SSR', icon: '🏷️', description: 'INF, CHD, UNMR, PETC, WEAP, EXST и др.', to: '/knowledge/remarks' },
      doc(pmRemarks),
      doc(pmPrm),
      { title: 'Колясочники', icon: '♿', description: 'WCHC / WCHS / WCHR / WCMP / WCBD / WCBW', to: '/knowledge/wheelchair' },
      doc(pmDocuments),
      doc(pmAnimals),
      file('avih-checklist', 'AVIH: инструкция по оформлению'),
      { title: 'Процедура PETC', icon: '🐕', description: 'Животное в салоне — пошагово', to: '/knowledge/petc' },
      { title: 'Процедура WEAP', icon: '🔫', description: 'Оружие и патроны на регистрации', to: '/knowledge/weap' },
      doc(pmCentrovka),
    ],
  },
  {
    title: 'Багаж и оплата',
    items: [doc(pmBaggage), doc(wrapFilm), doc(pmEmd)],
  },
  {
    title: 'Аэропорт',
    items: [
      { title: 'Телефоны Пулково', icon: '📞', description: 'Координаторы, центровка, багаж, службы', to: '/contacts' },
      { title: 'Схема стоек', icon: '🗺️', description: 'Терминалы ВВЛ и МВЛ: стойки и острова', to: '/knowledge/terminal' },
      { title: 'Обозначение мест', icon: '💺', description: 'Цвета карты мест, мягкий/жёсткий блок, младенец', to: '/knowledge/seats' },
      doc(pmRules),
    ],
  },
  {
    title: 'Обучение',
    items: [file('vocabulary', 'Словарь агента EN–RU'), file('amadeus-test', 'Тестирование Amadeus Altea')],
  },
]
