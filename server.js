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

// === Carpeta de uploads ===
const uploadDir = path.join(__dirname, 'backend/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// === Carpeta de assets (logo) ===
app.use('/assets', express.static(path.join(__dirname, 'frontend/assets')));

// === Rutas API ===
app.use('/api/auth', authRoutes);
app.use('/api/documents', docRoutes);

// === Servir frontend ===
app.use(express.static(path.join(__dirname, 'frontend')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 4000;

async function start() {
  await init();

  // Crear director demo
  const existingDirector = await User.findOne({ where: { email: 'director@school.test' } });
  if (!existingDirector) {
    const hash = await bcrypt.hash('directorpass', 10);
    await User.create({
      name: 'Director Demo',
      email: 'director@school.test',
      passwordHash: hash,
      role: 'director'
    });
    console.log('✅ Director demo creado: director@school.test / directorpass');
  }

  // Crear profesor demo
  const existingTeacher = await User.findOne({ where: { email: 'teacher@school.test' } });
  if (!existingTeacher) {
    const hash = await bcrypt.hash('teacherpass', 10);
    await User.create({
      name: 'Profesor Demo',
      email: 'teacher@school.test',
      passwordHash: hash,
      role: 'teacher'
    });
    console.log('✅ Profesor demo creado: teacher@school.test / teacherpass');
  }

  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

start();
