const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const numbersRoutes = require('./routes/numbers');
const callsRoutes = require('./routes/calls');
const queueRoutes = require('./routes/queue');
const dashboardRoutes = require('./routes/dashboard');
const contactsRoutes = require('./routes/contacts');

const app = express();

app.use(helmet());
app.use(cors());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/numbers', numbersRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/contacts', contactsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

module.exports = app;
