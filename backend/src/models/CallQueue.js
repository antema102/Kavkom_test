const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CallQueue = sequelize.define('CallQueue', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  contact_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('en_attente', 'en_cours', 'termine', 'annule'),
    defaultValue: 'en_attente',
    allowNull: false,
  },
  assigned_number_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  queued_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'call_queue',
  timestamps: false,
});

module.exports = CallQueue;
