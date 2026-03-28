const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CallLog = sequelize.define('CallLog', {
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
  outbound_number_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  extension_uuid: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  destination_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  call_status: {
    type: DataTypes.ENUM('en_cours', 'termine', 'echoue'),
    defaultValue: 'en_cours',
    allowNull: false,
  },
  call_result: {
    type: DataTypes.ENUM('repondu', 'pas_de_reponse', 'occupe', 'messagerie', 'invalide'),
    allowNull: true,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  recording_file: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  next_action: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  next_call_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  started_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  ended_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  form_filled_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'calls_log',
  timestamps: false,
});

module.exports = CallLog;
