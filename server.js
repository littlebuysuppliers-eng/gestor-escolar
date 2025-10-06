require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { init, User } = require('./backend/models');
const authRoutes = require('./backend/routes/auth');
const docRoutes = require('./backend/routes/documents');

const app = express();
app.use(cors());
app.use(express.json());

// Archivos estáticos (subidas)
app.use('/uploads', express.static(path.join(__dirname, 'backend', 'uploads')));

// APIs
app.use('/api/auth', authRoutes);
app.use('/api/documents', docRoutes);

// 📁 Ruta absoluta para frontend
const FRONTEND_DIR = path.resolve(__dirname, 'frontend');
console.log('📂 Sirviendo frontend desde:', FRONTEND_DIR);

// Archivos estáticos del frontend
app.use(express.static(FRONTEND_DIR));

// Para cualquier otra ruta, devolver index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

const PORT = process.env.PORT || 4000;

async function start() {
  await init();

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

  app.listen(PORT, () => console.log(`🚀 Servidor activo en puerto ${PORT}`));
}

start();
