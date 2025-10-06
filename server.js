require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // 👈 ESTA LÍNEA FALTABA

// 🔧 Importar módulos correctamente desde /backend
const { init, User } = require('./backend/models');
const authRoutes = require('./backend/routes/auth');
const docRoutes = require('./backend/routes/documents');

const app = express();

// 🧱 Middlewares
app.use(cors());
app.use(express.json());

// 📁 Servir archivos subidos
app.use('/uploads', express.static(path.join(__dirname, 'backend', 'uploads')));

// 🌐 Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/documents', docRoutes);

// 📦 Servir frontend (HTML, JS, CSS)
app.use(express.static(path.join(__dirname, 'frontend')));

// 🏠 Ruta principal → frontend/index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ⚙️ Puerto (Render usa variable PORT)
const PORT = process.env.PORT || 4000;

// 🚀 Iniciar servidor
async function start() {
  try {
    await init();

    // 👤 Crear usuario director demo si no existe
    const d = await User.findOne({ where: { role: 'director' } });
    if (!d) {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('directorpass', 10);
      await User.create({
        name: 'Director Demo',
        email: 'director@school.test',
        passwordHash: hash,
        role: 'director',
      });
      console.log('✅ Director creado: director@school.test / directorpass');
    }

    app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
  }
}

start();
