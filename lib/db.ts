import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

// Route database directly into /tmp (temporary filesystem) which is always mapped dynamically in docker/serverless instances!
const dbPath = path.join(os.tmpdir(), 'speedtest_prod.db');
const db = new Database(dbPath);

// Initialize schema on load
db.exec(`
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
  )
`);

try {
  db.exec(`ALTER TABLE SpeedTest ADD COLUMN packetLoss REAL DEFAULT 0`);
} catch (e) {
  // column already exists
}

try {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_speedtest_createdat ON SpeedTest(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_speedtest_ip ON SpeedTest(ip);
    CREATE INDEX IF NOT EXISTS idx_speedtest_isp ON SpeedTest(isp);
  `);
} catch (e) {
  // indexes might already exist or error on creation
}

export default db;
