-- ============================================
-- CVMap — Esquema de base de datos (SQLite)
-- ============================================

PRAGMA foreign_keys = ON;

-- ============================================
-- Tabla: companies
-- Empresas obtenidas y cacheadas desde Overpass API (OpenStreetMap)
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    osm_id         TEXT NOT NULL UNIQUE,
    name           TEXT NOT NULL,
    address        TEXT,
    phone          TEXT,
    website        TEXT,
    opening_hours  TEXT,
    category       TEXT,
    latitude       REAL NOT NULL,
    longitude      REAL NOT NULL,
    cached_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_companies_osm_id ON companies (osm_id);
CREATE INDEX IF NOT EXISTS idx_companies_category ON companies (category);
CREATE INDEX IF NOT EXISTS idx_companies_location ON companies (latitude, longitude);

-- ============================================
-- Tabla: tracking
-- Estado de seguimiento del usuario sobre una empresa (relación 1 a 1)
-- ============================================
CREATE TABLE IF NOT EXISTS tracking (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id  INTEGER NOT NULL UNIQUE,
    status      TEXT NOT NULL DEFAULT 'pendiente'
                CHECK (status IN ('pendiente', 'cv_enviado', 'respondio', 'entrevista', 'rechazado')),
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tracking_company_id ON tracking (company_id);
CREATE INDEX IF NOT EXISTS idx_tracking_status ON tracking (status);

-- ============================================
-- Tabla: tracking_events
-- Historial de eventos con fecha (envíos de CV, respuestas, entrevistas, notas)
-- ============================================
CREATE TABLE IF NOT EXISTS tracking_events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id  INTEGER NOT NULL,
    event_type  TEXT NOT NULL
                CHECK (event_type IN ('cv_enviado', 'respuesta', 'entrevista', 'otro')),
    event_date  DATE NOT NULL,
    note        TEXT,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_company_id ON tracking_events (company_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_event_date ON tracking_events (event_date);