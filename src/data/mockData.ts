import type { Airline, Airport, Document } from '../types'

export const airlines: Airline[] = [
  { code: 'DP', name: 'Pobeda', nameRu: 'Победа' },
  { code: 'SU', name: 'Aeroflot', nameRu: 'Аэрофлот' },
  { code: 'N4', name: 'Nordwind', nameRu: 'Nordwind' },
  { code: 'FV', name: 'Rossiya', nameRu: 'Россия' },
  { code: 'S7', name: 'S7 Airlines', nameRu: 'S7 Airlines' },
  { code: 'UT', name: 'UTair', nameRu: 'ЮТэйр' },
  { code: 'YQ', name: 'Alrosa', nameRu: 'Алроса' },
]

export const airports: Airport[] = [
  { code: 'VKO', name: 'Vnukovo', nameRu: 'Внуково', city: 'Moscow', cityRu: 'Москва', terminal: 'A' },
  { code: 'SVO', name: 'Sheremetyevo', nameRu: 'Шереметьево', city: 'Moscow', cityRu: 'Москва', terminal: 'D' },
  { code: 'DME', name: 'Domodedovo', nameRu: 'Домодедово', city: 'Moscow', cityRu: 'Москва', terminal: '1' },
  { code: 'AER', name: 'Sochi', nameRu: 'Сочи', city: 'Sochi', cityRu: 'Сочи', terminal: 'Main' },
  { code: 'LED', name: 'Pulkovo', nameRu: 'Пулково', city: 'Saint Petersburg', cityRu: 'Санкт-Петербург', terminal: '1' },
  { code: 'KZN', name: 'Kazan', nameRu: 'Казань', city: 'Kazan', cityRu: 'Казань', terminal: '1' },
  { code: 'SVX', name: 'Koltsovo', nameRu: 'Кольцово', city: 'Yekaterinburg', cityRu: 'Екатеринбург', terminal: '1' },
  { code: 'OVB', name: 'Tolmachevo', nameRu: 'Толмачёво', city: 'Novosibirsk', cityRu: 'Новосибирск', terminal: 'A' },
  { code: 'ROV', name: 'Platov', nameRu: 'Платов', city: 'Rostov', cityRu: 'Ростов-на-Дону', terminal: '1' },
  { code: 'KRR', name: 'Pashkovsky', nameRu: 'Пашковский', city: 'Krasnodar', cityRu: 'Краснодар', terminal: '1' },
  { code: 'UFA', name: 'Ufa', nameRu: 'Уфа', city: 'Ufa', cityRu: 'Уфа', terminal: '1' },
  { code: 'MRV', name: 'Mineralnye Vody', nameRu: 'Минеральные Воды', city: 'Mineralnye Vody', cityRu: 'Минводы', terminal: '1' },
]

export { specialPassengerGuides } from './specialGuides'

export const documents: Document[] = [
  {
    id: '1',
    name: 'Pobeda Operations Manual',
    nameRu: 'Операционное руководство Победа',
    type: 'pdf',
    size: 2450000,
    url: '#',
    folder: 'Pobeda',
    airline: 'DP',
    uploadedAt: new Date('2026-09-15'),
    uploadedBy: 'admin',
  },
  {
    id: '2',
    name: 'Aeroflot Safety Procedures',
    nameRu: 'Процедуры безопасности Аэрофлот',
    type: 'pdf',
    size: 1800000,
    url: '#',
    folder: 'Aeroflot',
    airline: 'SU',
    uploadedAt: new Date('2026-09-20'),
    uploadedBy: 'admin',
  },
  {
    id: '3',
    name: 'FAP Aviation Regulations',
    nameRu: 'ФАП Авиационные правила',
    type: 'pdf',
    size: 5200000,
    url: '#',
    folder: 'Regulations',
    uploadedAt: new Date('2026-08-10'),
    uploadedBy: 'admin',
  },
  {
    id: '4',
    name: 'UMKA Handling Guide',
    nameRu: 'Инструкция по УМКА',
    type: 'docx',
    size: 450000,
    url: '#',
    folder: 'Guides',
    uploadedAt: new Date('2026-09-25'),
    uploadedBy: 'ivanov',
  },
  {
    id: '5',
    name: 'Emergency Contacts',
    nameRu: 'Экстренные контакты',
    type: 'pdf',
    size: 120000,
    url: '#',
    folder: 'General',
    uploadedAt: new Date('2026-09-01'),
    uploadedBy: 'admin',
  },
]
