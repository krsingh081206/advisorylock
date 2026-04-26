const dotenv = require("dotenv");

dotenv.config();

function buildDatabaseUrl() {
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || 5432;
  const user = process.env.DB_USER || "root";
  const password = encodeURIComponent(process.env.DB_PASSWORD || "Hello123#");
  const db = process.env.DB_NAME || "advisorylock";

  return `postgres://${user}:${password}@${host}:${port}/${db}`;
}

const config = {
  databaseUrl: process.env.DATABASE_URL || buildDatabaseUrl(),
  txMutexLockKey: Number(process.env.TX_MUTEX_LOCK_KEY || 10001),
  cronSessionLockKey: Number(process.env.CRON_SESSION_LOCK_KEY || 20001),
  cronIntervalMs: Number(process.env.CRON_INTERVAL_MS || 5000),
  longJobDurationMs: Number(process.env.LONG_JOB_DURATION_MS || 15000)
};

module.exports = config;
