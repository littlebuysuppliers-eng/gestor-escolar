const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// === Middlewares ===
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === Importar rutas ===
const authRoutes = require('./backend/routes/auth');
const usersRoutes = require('./backend/routes/users');
const documentsRoutes = require('./backend/routes/documents');

// === Rutas API ===
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/documents', documentsRoutes);

// === Servir frontend en producción ===
app.use(express.static(path.join(__dirname, 'frontend')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// === Iniciar servidor ===
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
