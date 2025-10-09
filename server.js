require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const { init, User } = require('./backend/models');
const authRoutes = require('./backend/routes/auth');
const docRoutes = require('./backend/routes/documents');

const app = express();
app.use(cors());
app.use(express.json());

// Carpeta de uploads local (temporal)
const uploadDir = path.join(__dirname, 'backend/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/documents', docRoutes);

// Servir frontend
app.use(express.static(path.join(__dirname, 'frontend')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;

async function start() {
  await init();

  // Crear director demo
  const d = await User.findOne({ where: { role: 'director' } });
  if (!d) {
    const hash = await bcrypt.hash('1234', 10);
    await User.create({
      name: 'Director Demo',
      email: 'director@demo.com',
      passwordHash: hash,
      role: 'director'
    });
    console.log('✅ Director creado: director@demo.com / 1234');
  }

  // Crear profesor demo
  const t = await User.findOne({ where: { role: 'teacher' } });
  if (!t) {
    const hash = await bcrypt.hash('1234', 10);
    await User.create({
      name: 'Profesor Demo',
      email: 'profesor@demo.com',
      passwordHash: hash,
      role: 'teacher'
    });
    console.log('✅ Profesor creado: profesor@demo.com / 1234');
  }

  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

start();
