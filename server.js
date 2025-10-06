require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { init, User } = require('./backend/models');
const authRoutes = require('./backend/routes/auth');
const docRoutes = require('./backend/routes/documents');
const bcrypt = require('bcrypt');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Rutas backend ---
app.use('/api/auth', authRoutes);
app.use('/api/documents', docRoutes);

// --- Archivos estáticos del frontend ---
app.use(express.static(path.join(__dirname, 'frontend')));

// --- Ruta base: index.html ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// --- Inicialización del servidor ---
const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await init();

    // Crear director demo si no existe
    const existingDirector = await User.findOne({ where: { role: 'director' } });
    if (!existingDirector) {
      const hash = await bcrypt.hash('directorpass', 10);
      await User.create({
        name: 'Director Demo',
        email: 'director@school.test',
        passwordHash: hash,
        role: 'director',
      });
      console.log('✅ Director creado: director@school.test / directorpass');
    }

    app.listen(PORT, () => console.log(`🚀 Servidor corriendo en el puerto ${PORT}`));
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
  }
}

start();
