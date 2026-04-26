const { sequelize } = require('./models');
const { runSingletonCronJob, closePool } = require('./locks');
const config = require('./config');

const workerId = process.env.WORKER_ID || `worker-${process.pid}`;

async function tick() {
  try {
    const result = await runSingletonCronJob(workerId, config.longJobDurationMs);
    console.log(`[${new Date().toISOString()}]`, result.message);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Worker error:`, error.message);
  }
}

async function start() {
  await sequelize.authenticate();
  console.log(`Cron worker started: ${workerId}`);

  await tick();
  const interval = setInterval(tick, config.cronIntervalMs);

  async function shutdown() {
    clearInterval(interval);
    await closePool();
    await sequelize.close();
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch(async (error) => {
  console.error('Failed to start cron worker:', error);
  await closePool();
  process.exit(1);
});
