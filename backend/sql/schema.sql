-- ============================================================
-- Healthcare Appointment Booking Platform — Database Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  role_id   SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (role_name) VALUES ('patient'), ('doctor'), ('admin')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  user_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                VARCHAR(150) NOT NULL,
  email               VARCHAR(255) UNIQUE NOT NULL,
  password            TEXT NOT NULL,
  phone               VARCHAR(30),
  language_preference VARCHAR(10) DEFAULT 'en',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. USER ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
  user_role_id SERIAL PRIMARY KEY,
  user_id      UUID    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role_id      INTEGER NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  UNIQUE(user_id, role_id)
);

-- ============================================================
-- 4. HEALTH CENTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS health_centers (
  health_center_id SERIAL PRIMARY KEY,
  name             VARCHAR(150) NOT NULL,
  address          TEXT,
  phone            VARCHAR(30),
  email            VARCHAR(255),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. SPECIALTIES
-- ============================================================
CREATE TABLE IF NOT EXISTS specialties (
  specialty_id   SERIAL PRIMARY KEY,
  specialty_name VARCHAR(100) UNIQUE NOT NULL,
  description    TEXT
);

INSERT INTO specialties (specialty_name, description) VALUES
  ('Cardiology',      'Heart and cardiovascular system'),
  ('Dermatology',     'Skin, hair, and nails'),
  ('Pediatrics',      'Medical care for children'),
  ('Neurology',       'Nervous system disorders'),
  ('Orthopedics',     'Musculoskeletal system'),
  ('Psychiatry',      'Mental health disorders'),
  ('Oncology',        'Cancer treatment'),
  ('Gynecology',      'Female reproductive health'),
  ('Urology',         'Urinary tract system'),
  ('General Practice','Family medicine')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. DOCTOR PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS doctor_profiles (
  doctor_id        UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  specialty_id     INTEGER REFERENCES specialties(specialty_id),
  health_center_id INTEGER REFERENCES health_centers(health_center_id),
  status           VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','suspended')),
  experience_years INTEGER DEFAULT 0,
  bio              TEXT,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. PATIENT PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS patient_profiles (
  patient_id    UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender        VARCHAR(20),
  medical_notes TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. DOCTOR AVAILABILITY
-- ============================================================
CREATE TABLE IF NOT EXISTS doctor_availability (
  availability_id SERIAL PRIMARY KEY,
  doctor_id       UUID    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  day_of_week     INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time      TIME    NOT NULL,
  end_time        TIME    NOT NULL,
  slot_duration   INTEGER DEFAULT 30,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor ON doctor_availability(doctor_id);

-- ============================================================
-- 9. APPOINTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  appointment_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id       UUID    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  doctor_id        UUID    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  appointment_date DATE    NOT NULL,
  appointment_time TIME    NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  reason           TEXT,
  status           VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','cancelled','completed')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (doctor_id, appointment_date, appointment_time)
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor  ON appointments(doctor_id);

-- ============================================================
-- 10. DOCTOR REVIEWS / RATINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS doctor_reviews (
  review_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id  UUID    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  patient_id UUID    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (doctor_id, patient_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_doctor ON doctor_reviews(doctor_id);

-- ============================================================
-- 11. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type            VARCHAR(60) NOT NULL,
  message         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ============================================================
-- 12. AI RECOMMENDATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_recommendations (
  recommendation_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id               UUID    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  recommended_specialty_id INTEGER REFERENCES specialties(specialty_id),
  recommended_doctor_id    UUID    REFERENCES users(user_id) ON DELETE SET NULL,
  symptoms_input           TEXT,
  confidence_score         NUMERIC(5,2),
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_recs_patient ON ai_recommendations(patient_id);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_verified    BOOLEAN     DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS otp_code       VARCHAR(6),
  ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;