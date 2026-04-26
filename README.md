# Advisory Lock POC (Node.js + Sequelize + PostgreSQL)

This project demonstrates PostgreSQL advisory locks in two patterns:

1. Transaction-level advisory lock (`pg_try_advisory_xact_lock`) for a local mutex-style critical section.
2. Session-level advisory lock (`pg_try_advisory_lock`) to ensure only one long-running cron job instance runs across distributed workers.

## Tech Stack

- Node.js
- Sequelize
- PostgreSQL

## Project Structure

- `src/locks.js`: Lock acquisition/release logic.
- `src/models/index.js`: Sequelize models (`Counter`, `CronRun`).
- `src/initDb.js`: Initializes schema and seed data.
- `src/demoMutex.js`: Runs concurrent mutex attempts locally to show lock behavior.
- `src/cronWorker.js`: Distributed cron worker using a session-level advisory lock.
- `docker-compose.yml`: Local PostgreSQL setup.

## Setup

1. Copy environment file:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Start PostgreSQL:

```bash
docker compose up -d
```

4. Initialize DB schema:

```bash
npm run init-db
```

## Run Local Mutex Demo

```bash
npm start
```

Or:

```bash
npm run demo:mutex
```

The demo starts several concurrent attempts with the same advisory lock key:

- one attempt acquires the transaction-level advisory lock and increments the counter,
- the others return `locked: false` because `pg_try_advisory_xact_lock` is non-blocking.

## Run Distributed Cron Worker Demo

Start two workers in separate terminals:

```bash
WORKER_ID=worker-a npm run worker
WORKER_ID=worker-b npm run worker
```

Behavior:

- only one worker acquires `pg_try_advisory_lock` and runs the long job,
- other workers skip while the session-level lock is held,
- the lock is released explicitly with `pg_advisory_unlock` once the job completes.

Check run history in the `cron_runs` table to verify singleton execution.

## Notes

- Advisory lock keys are configured in `.env`.
- Transaction lock auto-releases on transaction commit/rollback.
- Session lock persists for the connection session and must be explicitly released, or it releases when the connection closes.
