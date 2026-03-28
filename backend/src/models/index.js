const sequelize = require('../config/database');
const OutboundNumber = require('./OutboundNumber');
const CallQueue = require('./CallQueue');
const CallLog = require('./CallLog');
const Contact = require('./Contact');
const User = require('./User');

// Associations
CallLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
CallLog.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });
CallLog.belongsTo(OutboundNumber, { foreignKey: 'outbound_number_id', as: 'outboundNumber' });

CallQueue.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
CallQueue.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });

Contact.hasMany(CallLog, { foreignKey: 'contact_id', as: 'calls' });
User.hasMany(CallLog, { foreignKey: 'user_id', as: 'calls' });

module.exports = {
  sequelize,
  OutboundNumber,
  CallQueue,
  CallLog,
  Contact,
  User,
};
