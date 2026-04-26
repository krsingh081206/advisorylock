const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Counter = sequelize.define(
  'Counter',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    tableName: 'counters',
    timestamps: true
  }
);

const CronRun = sequelize.define(
  'CronRun',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    workerId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'started'
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: 'cron_runs',
    timestamps: true
  }
);

module.exports = {
  sequelize,
  Counter,
  CronRun
};
