require('dotenv').config();
const { sequelize, User, OutboundNumber, Contact } = require('./models');

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('Database reset.');

    await User.bulkCreate([
      { username: 'admin', password: 'admin123', name: 'Administrateur', role: 'admin' },
      { username: 'commercial1', password: 'pass123', name: 'Jean Dupont', role: 'commercial', extension_uuid: 'ext-001' },
      { username: 'commercial2', password: 'pass123', name: 'Marie Leroy', role: 'commercial', extension_uuid: 'ext-002' },
      { username: 'commercial3', password: 'pass123', name: 'Pierre Martin', role: 'commercial', extension_uuid: 'ext-003' },
      { username: 'commercial4', password: 'pass123', name: 'Sophie Bernard', role: 'commercial', extension_uuid: 'ext-004' },
    ], { individualHooks: true });
    console.log('Users created.');

    await OutboundNumber.bulkCreate([
      { phone_number: '01 23 45 67 89', status: 'libre' },
      { phone_number: '01 98 76 54 32', status: 'libre' },
    ]);
    console.log('Outbound numbers created.');

    await Contact.bulkCreate([
      { name: 'Entreprise ABC', phone: '06 12 34 56 78', email: 'contact@abc.fr', company: 'ABC SAS' },
      { name: 'Société XYZ', phone: '06 98 76 54 32', email: 'info@xyz.fr', company: 'XYZ SARL' },
      { name: 'Martin & Fils', phone: '07 11 22 33 44', email: 'martin@mf.fr', company: 'Martin & Fils' },
      { name: 'Tech Solutions', phone: '06 55 44 33 22', email: 'hello@techsol.fr', company: 'Tech Solutions SAS' },
      { name: 'Global Corp', phone: '01 44 55 66 77', email: 'rh@global.fr', company: 'Global Corp' },
    ]);
    console.log('Contacts created.');

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
