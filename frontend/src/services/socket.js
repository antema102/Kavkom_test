import { io } from 'socket.io-client';

let socket = null;

export function connect() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  socket = io('http://localhost:3001', {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
}

export function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function on(event, callback) {
  if (socket) {
    socket.on(event, callback);
  }
}

export function off(event, callback) {
  if (socket) {
    socket.off(event, callback);
  }
}

export function getSocket() {
  return socket;
}
