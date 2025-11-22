<<<<<<< HEAD
const app = require('./app');
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});

// Apagado ordenado
function shutdown(signal) {
  console.log(`Recibido ${signal}, cerrando servidor...`);
  server.close(err => {
    if (err) {
      console.error('Error al cerrar servidor:', err);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
=======
// src/server.js
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`AppTiziHause corriendo en http://localhost:${PORT}`);
});

>>>>>>> origin/main
