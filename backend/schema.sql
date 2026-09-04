PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  simulated INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS telemetry (
  id INTEGER PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  received_at TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  temperature REAL,
  humidity REAL,
  sos INTEGER NOT NULL,
  UNIQUE(device_id,event_id)
);
CREATE INDEX IF NOT EXISTS telemetry_device_time ON telemetry(device_id,received_at);
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY,
  telemetry_id INTEGER NOT NULL REFERENCES telemetry(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  acknowledged_at TEXT,
  UNIQUE(telemetry_id,kind)
);
