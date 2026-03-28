const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const phoneRotation = require('../services/phoneRotation');

function setupWebSocket(io) {
  phoneRotation.setIo(io);

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User ${socket.userId} connected`);

    try {
      const numbers = await phoneRotation.getNumbersStatus();
      socket.emit('number_status_changed', numbers);

      const queue = await phoneRotation.getQueueStatus();
      socket.emit('queue_updated', queue);
    } catch (error) {
      console.error('Error sending initial state:', error);
    }

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });
}

module.exports = setupWebSocket;
