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

// Servir los archivos subidos
app.use('/uploads', express.static(path.join(__dirname, 'backend/uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', docRoutes);

// Servir el frontend
app.use(express.static(path.join(__dirname, 'frontend')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 4000;

async function start() {
  await init();
  const bcrypt = require('bcrypt');

  // Crear un usuario director demo si no existe
  const director = await User.findOne({ where: { role: 'director' } });
  if (!director) {
    const hash = await bcrypt.hash('directorpass', 10);
    await User.create({
      name: 'Director Demo',
      email: 'director@school.test',
      passwordHash: hash,
      role: 'director'
    });
    console.log('✅ Director creado: director@school.test / directorpass');
  }

  // Crear un usuario teacher demo si no existe
  const teacher = await User.findOne({ where: { role: 'teacher' } });
  if (!teacher) {
    const hash = await bcrypt.hash('teacherpass', 10);
    await User.create({
      name: 'Profesor Demo',
      email: 'teacher@school.test',
      passwordHash: hash,
      role: 'teacher'
    });
    console.log('✅ Profesor creado: teacher@school.test / teacherpass');
  }

  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

start();
