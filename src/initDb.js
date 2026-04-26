const { sequelize, Counter } = require('./models');

async function initDb() {
  await sequelize.authenticate();
  await sequelize.sync();

  await Counter.findOrCreate({
    where: { id: 1 },
    defaults: { value: 0 }
  });

  console.log('Database initialized.');
  await sequelize.close();
}

initDb().catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});
