const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OutboundNumber = sequelize.define('OutboundNumber', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  phone_number: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('libre', 'en_appel', 'post_appel', 'maintenance'),
    defaultValue: 'libre',
    allowNull: false,
  },
  current_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  current_call_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  last_used_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'outbound_numbers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = OutboundNumber;
