<<<<<<< HEAD
# AeroDesk / SkyHelper — «Авиа-помощник»

Премиальное мобильное приложение для бортпроводников, агентов регистрации и сотрудников авиакомпаний.

> Вбил номер рейса → увидел всё: вылет, посадку, гейт, стойку, статус, особых пассажиров.

## Статус

**MVP** — адаптивный веб-сайт без авторизации. Открывается сразу на главной.

Клиент: **React + Vite + TypeScript**. Backend и SQL-схема готовы к расширению.

## Стек

| Слой | Технология |
|------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Lucide |
| Backend | FastAPI, WebSocket, MockFlightDataProvider |
| Data (план) | PostgreSQL, Redis, S3, OpenSearch |
| Design | Lavender Aviation Glass · Light / Dark |

## Быстрый старт (frontend)

```bash
npm install
npm run dev
```

Откройте http://localhost:5173 — сразу главная, без входа.

### Демо real-time

Откройте рейс **DP307** — через ~4 сек гейт сменится `12A → 15B`, появится push в центре уведомлений.

## Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --app-dir .
```

API: http://localhost:8000/docs  
Health: http://localhost:8000/health  
WebSocket: `ws://localhost:8000/ws/flights`

PostgreSQL schema: `backend/schema.sql`

## Основные экраны MVP

1. Splash → Onboarding → Login (табельный + Face ID)
2. Home: поиск, autocomplete, статистика дня, мои рейсы
3. Flight Details: маршрут, gate, стойки, timeline, особые паксы, live gate change
4. Рейсы / Документы / Контакты
5. Особые пассажиры + чеклист-памятки
6. Уведомления, Мои вкладки, Настройки (light/dark/system)
7. Смена: открыть / закрыть

## Роли (заложены)

Guest · Employee · Senior Shift · Admin

## Roadmap

- **MVP** ✅ UI + mock data + auth flow + offline-ready cache hooks
- **v1.1** Real WebSocket client, FCM/APNs, favorites sync
- **v1.2** Admin web panel, custom tabs CRUD, audit log UI
- **v2.0** Airline/airport providers, Sabre/Amadeus, Flutter native apps

## Архитектура данных о рейсах

```
FlightDataProvider (abstract)
 ├─ MockFlightDataProvider      ← сейчас
 ├─ AirportBoardProvider
 ├─ AirlineApiProvider
 └─ ThirdPartyProvider (AeroDataBox / AviationStack / …)
```

Приоритет: внутренний АК → табло аэропорта → официальный API → сторонний → fallback.

## Design tokens

Accent: lavender · Surfaces: white / deep navy · Status: green / amber / red / blue  
Типографика: Inter · min body 15px · critical values 22–36px  
Safe Area / Dynamic Island / Home Indicator учтены в layout.

## Безопасность (план production)

JWT + refresh rotation · Keychain/Keystore · RBAC · audit_log · rate limit · 152-ФЗ разделение PII.
=======
# https-SkyHelper.github.io
>>>>>>> 52d48442426abe8d8817b704f819ae30404c4f74
