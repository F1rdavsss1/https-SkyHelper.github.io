-- AeroDesk PostgreSQL schema (production-ready draft)
-- Compatible with 152-FZ separation: auth / personal / operational

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('guest', 'employee', 'senior_shift', 'admin');
CREATE TYPE flight_status AS ENUM (
  'on_time', 'delayed', 'cancelled', 'boarding', 'departed', 'arrived', 'scheduled'
);
CREATE TYPE special_category AS ENUM ('umka', 'prm', 'petc', 'depa', 'vip', 'medical');
CREATE TYPE tab_access AS ENUM ('private', 'shift', 'all');

-- Auth (minimal PII)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number VARCHAR(32) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  airline_code VARCHAR(8),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Personal data (store separately / encrypt at rest in production)
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  avatar_url TEXT
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE airlines (
  code VARCHAR(8) PRIMARY KEY,
  name TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  logo_url TEXT
);

CREATE TABLE airports (
  code VARCHAR(8) PRIMARY KEY,
  name TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  city TEXT NOT NULL,
  city_ru TEXT NOT NULL,
  terminal TEXT
);

CREATE TABLE flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_number VARCHAR(16) NOT NULL,
  airline_code VARCHAR(8) NOT NULL REFERENCES airlines(code),
  from_airport VARCHAR(8) NOT NULL REFERENCES airports(code),
  to_airport VARCHAR(8) NOT NULL REFERENCES airports(code),
  scheduled_departure TIMESTAMPTZ NOT NULL,
  actual_departure TIMESTAMPTZ,
  scheduled_arrival TIMESTAMPTZ NOT NULL,
  actual_arrival TIMESTAMPTZ,
  status flight_status NOT NULL DEFAULT 'scheduled',
  gate VARCHAR(16),
  previous_gate VARCHAR(16),
  check_in_desks VARCHAR(32),
  check_in_start TIMESTAMPTZ,
  check_in_end TIMESTAMPTZ,
  boarding_start TIMESTAMPTZ,
  boarding_end TIMESTAMPTZ,
  aircraft_type VARCHAR(32),
  aircraft_registration VARCHAR(16),
  delay_minutes INT NOT NULL DEFAULT 0,
  data_source VARCHAR(64) NOT NULL DEFAULT 'mock',
  confidence REAL NOT NULL DEFAULT 1.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (flight_number, scheduled_departure)
);

CREATE INDEX idx_flights_number ON flights (flight_number);
CREATE INDEX idx_flights_departure ON flights (scheduled_departure);
CREATE INDEX idx_flights_status ON flights (status);

CREATE TABLE flight_special_passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_id UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  category special_category NOT NULL,
  count INT NOT NULL DEFAULT 1
);

CREATE TABLE special_passenger_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category special_category NOT NULL UNIQUE,
  title TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  description TEXT,
  description_ru TEXT,
  checklist JSONB NOT NULL DEFAULT '[]',
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE document_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  airline_code VARCHAR(8) REFERENCES airlines(code),
  parent_id UUID REFERENCES document_folders(id)
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES document_folders(id),
  name TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  mime_type VARCHAR(64) NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_key TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  position TEXT NOT NULL,
  shift_label TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  airline_code VARCHAR(8),
  status VARCHAR(16) NOT NULL DEFAULT 'off_shift',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE custom_tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  icon TEXT,
  type VARCHAR(16) NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  access tab_access NOT NULL DEFAULT 'private',
  created_by UUID NOT NULL REFERENCES users(id),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type VARCHAR(32) NOT NULL,
  entity_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, entity_type, entity_id)
);

CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  label TEXT
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL,
  title TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  message TEXT NOT NULL,
  message_ru TEXT NOT NULL,
  flight_number VARCHAR(16),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_created ON audit_log (created_at DESC);
