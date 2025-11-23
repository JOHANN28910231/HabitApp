// Merged server.js — provide graceful shutdown and export server
require('dotenv').config();
const app = require('./app');
const http = require('http');

const PORT = Number(process.env.PORT || 3000);
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log('Server running on port', PORT);
});

const shutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(err => {
    if (err) {
      console.error('Error during server close:', err);
      process.exit(1);
    }
    console.log('Server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = server;
