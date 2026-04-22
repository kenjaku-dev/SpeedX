import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Use a temporary writable directory for Docker/environments where process.cwd() might be read-only occasionally
const dbPath = path.join(process.cwd(), 'speedtest.db');
const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS SpeedTest (
    id TEXT PRIMARY KEY,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ping REAL,
    jitter REAL,
    download REAL,
    upload REAL,
    ip TEXT,
    isp TEXT,
    city TEXT,
    country TEXT,
    server TEXT,
    userAgent TEXT
  )
`);

export default db;
