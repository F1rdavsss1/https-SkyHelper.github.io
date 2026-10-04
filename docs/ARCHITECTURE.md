# Architecture — AeroDesk

## Client (current)

```
src/
  components/     # UI kit + FlightCard, Autocomplete, BottomNav, PhoneFrame
  context/        # Theme, Auth, Notifications
  data/           # Mock seed (airlines, flights, guides, contacts, docs)
  pages/          # Feature screens
  types/          # Domain models
  lib/            # cn, formatters
```

Clean-ish feature boundaries; providers abstract remote APIs for later.

## Backend

```
backend/
  app/main.py       # FastAPI routes + MockFlightDataProvider + WS
  schema.sql        # PostgreSQL production schema
  requirements.txt
  .env.example
```

### API surface (v1)

- `POST /api/v1/auth/login`
- `GET  /api/v1/flights?q=`
- `GET  /api/v1/flights/{id}`
- `PATCH /api/v1/flights/{id}/gate`
- `GET  /api/v1/contacts`
- `GET  /api/v1/special-passengers`
- `WS   /ws/flights`

## Flutter migration path

When Flutter SDK is available, map 1:1:

| React | Flutter |
|-------|---------|
| pages/* | features/*/presentation |
| context | Riverpod / Bloc |
| react-router | go_router |
| mockData | data/mock + repository |
| FastAPI | same backend |

Keep REST + WS contracts stable — UI can be rewritten without backend changes.

## Environments

- development — mock provider, local tokens
- staging — real DB + Redis, sandbox flight APIs
- production — multi-provider merge, FCM/APNs, S3, OpenSearch
