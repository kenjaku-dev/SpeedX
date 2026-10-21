import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS SpeedTest (
    id TEXT PRIMARY KEY,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ping REAL,
    jitter REAL,
    packetLoss REAL DEFAULT 0,
    download REAL,
    upload REAL,
    ip TEXT,
    isp TEXT,
    city TEXT,
    country TEXT,
    server TEXT,
    userAgent TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_speedtest_createdat ON SpeedTest(createdAt DESC);
  CREATE INDEX IF NOT EXISTS idx_speedtest_ip ON SpeedTest(ip);
  CREATE INDEX IF NOT EXISTS idx_speedtest_isp ON SpeedTest(isp);
`;

/**
 * Pick a writable location for the database.
 *
 * Shared result links are useless if they die on the next deploy, so the
 * project-local `data/` directory is preferred. Read-only/serverless
 * filesystems fall back to the OS temp directory.
 */
function resolveDbPath(): string {
  const configured = process.env.SPEEDX_DB_PATH?.trim();
  if (configured) {
    try {
      fs.mkdirSync(path.dirname(configured), { recursive: true });
      return configured;
    } catch {
      // fall through to the default candidates
    }
  }

  const local = path.join(process.cwd(), 'data', 'speedx.db');
  try {
    fs.mkdirSync(path.dirname(local), { recursive: true });
    fs.accessSync(path.dirname(local), fs.constants.W_OK);
    return local;
  } catch {
    return path.join(os.tmpdir(), 'speedx.db');
  }
}

function createDb() {
  const database = new Database(resolveDbPath());
  // Wait for another build worker or server process before changing modes or
  // creating the schema.
  database.pragma('busy_timeout = 5000');
  // WAL keeps reads from blocking on the result insert during an active test.
  database.pragma('journal_mode = WAL');
  database.exec(SCHEMA);

  // Databases created before packetLoss existed.
  try {
    database.exec('ALTER TABLE SpeedTest ADD COLUMN packetLoss REAL DEFAULT 0');
  } catch {
    // column already exists
  }

  return database;
}

// Next.js re-evaluates modules on every hot reload in development, which would
// otherwise leak a SQLite handle per save.
const globalForDb = globalThis as unknown as { __speedxDb?: ReturnType<typeof createDb> };

const db = globalForDb.__speedxDb ?? createDb();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__speedxDb = db;
}

export default db;
