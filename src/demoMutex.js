const { sequelize } = require('./models');
const { tryTransactionMutexIncrement } = require('./locks');

async function run() {
  await sequelize.authenticate();

  const attempts = 5;
  const jobs = Array.from({ length: attempts }, () => tryTransactionMutexIncrement(2000));
  const results = await Promise.allSettled(jobs);

  console.log('Concurrent transaction lock attempts:');
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(index + 1, result.value);
    } else {
      console.log(index + 1, { error: result.reason.message });
    }
  });

  await sequelize.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
