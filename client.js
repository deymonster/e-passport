//const { io } = require('socket.io-client');
import io from 'socket.io-client';

const socket = io('http://localhost:4000', {
  transports: ['websocket'],
  path: '/socket.io/',
});

// Connection handler
socket.on('connect', () => {
  console.log('Connected to server with ID:', socket.id);
});

// Authentication response
socket.on('authenticated', (data) => {
  console.log('Authentication response:', data);
});

// Handle loaded messages
socket.on('loadMessages', (messages) => {
  console.log('\nLoaded messages from ticket:', messages);
});

// Handle new messages
socket.on('newMessage', (message) => {
  console.log('\nNew message received:', message);
});

// Handle participant events
socket.on('participantJoined', (data) => {
  console.log('\nParticipant joined:', data);
});

socket.on('participantLeft', (data) => {
  console.log('\nParticipant left:', data);
});

// Error handler
socket.on('error', (err) => {
  console.error('Socket error:', err);
});

// Disconnect handler
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

// Test sequence
const ticketId = 1;
const userId = 1; // Replace with actual user ID
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runUserTest() {
  try {
    // Wait for connection
    await delay(1000);
    
    // Authenticate as user
    console.log('\nAuthenticating as user...');
    socket.emit('authenticate', { role: 'user', userId });
    
    await delay(1000);
    
    // Join ticket room
    console.log('\nJoining ticket room...');
    socket.emit('joinTicket', ticketId);
    
    // Wait and send a test message
    await delay(2000);
    console.log('\nSending test message as user...');
    socket.emit('message', {
      ticketId: ticketId,
      content: 'Hello, I need help with my passport application'
    });

    // Leave after some time
    await delay(5000);
    console.log('\nLeaving ticket room...');
    socket.emit('leaveTicket', ticketId);

    // Disconnect
    await delay(1000);
    console.log('\nTests completed, disconnecting...');
    socket.disconnect();
  } catch (error) {
    console.error('Test error:', error);
  }
}

async function runAdminTest() {
  try {
    // Wait for connection
    await delay(1000);
    
    // Authenticate as admin
    console.log('\nAuthenticating as admin...');
    socket.emit('authenticate', { role: 'admin', userId: 999 }); // Admin ID
    
    await delay(1000);
    
    // Join ticket room
    console.log('\nJoining ticket room...');
    socket.emit('joinTicket', ticketId);
    
    // Wait and send a response
    await delay(2000);
    console.log('\nSending response as admin...');
    socket.emit('message', {
      ticketId: ticketId,
      content: 'Hello! I can help you with your application. What specific issues are you having?'
    });

    // Leave after some time
    await delay(5000);
    console.log('\nLeaving ticket room...');
    socket.emit('leaveTicket', ticketId);

    // Disconnect
    await delay(1000);
    console.log('\nTests completed, disconnecting...');
    socket.disconnect();
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Choose which test to run
const isAdmin = process.argv[2] === 'admin';
if (isAdmin) {
  console.log('Running admin test...');
  runAdminTest();
} else {
  console.log('Running user test...');
  runUserTest();
}
