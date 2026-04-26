const { QueryTypes } = require('sequelize');
const { Pool } = require('pg');
const config = require('./config');
const { sequelize, Counter, CronRun } = require('./models');

const pool = new Pool({ connectionString: config.databaseUrl });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryTransactionMutexIncrement(delayMs = 1000) {
  return sequelize.transaction(async (transaction) => {
    const rows = await sequelize.query('SELECT pg_try_advisory_xact_lock(:lockKey) AS locked', {
      replacements: { lockKey: config.txMutexLockKey },
      type: QueryTypes.SELECT,
      transaction
    });

    if (!rows[0].locked) {
      return {
        locked: false,
        message: 'Could not acquire transaction-level advisory lock'
      };
    }

    const counter = await Counter.findByPk(1, { transaction });
    const currentValue = counter.value;

    if (delayMs > 0) {
      await sleep(delayMs);
    }

    counter.value = currentValue + 1;
    await counter.save({ transaction });

    return {
      locked: true,
      message: 'Transaction-level advisory lock acquired and released on commit',
      previousValue: currentValue,
      currentValue: counter.value
    };
  });
}

async function runSingletonCronJob(workerId, durationMs = config.longJobDurationMs) {
  const client = await pool.connect();
  let locked = false;

  try {
    const lockResult = await client.query('SELECT pg_try_advisory_lock($1) AS locked', [
      config.cronSessionLockKey
    ]);

    locked = lockResult.rows[0].locked;

    if (!locked) {
      return {
        locked: false,
        message: `Worker ${workerId} skipped because another session holds the lock`
      };
    }

    const run = await CronRun.create({
      workerId,
      status: 'started',
      startedAt: new Date()
    });

    await sleep(durationMs);

    await run.update({
      status: 'completed',
      endedAt: new Date()
    });

    return {
      locked: true,
      message: `Worker ${workerId} completed job with session-level advisory lock`,
      runId: run.id
    };
  } finally {
    if (locked) {
      await client.query('SELECT pg_advisory_unlock($1)', [config.cronSessionLockKey]);
    }

    client.release();
  }
}

async function closePool() {
  await pool.end();
}

module.exports = {
  tryTransactionMutexIncrement,
  runSingletonCronJob,
  closePool
};
