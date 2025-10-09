require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { init, User } = require('./backend/models');

const authRoutes = require('./backend/routes/auth');
const docRoutes = require('./backend/routes/documents');

const app = express();
app.use(cors());
app.use(express.json());

// === Rutas API ===
app.use('/api/auth', authRoutes);
app.use('/api/documents', docRoutes);

// === Servir frontend ===
app.use(express.static('frontend'));
app.get('*', (req, res) => res.sendFile(require('path').join(__dirname, 'frontend', 'index.html')));

const PORT = process.env.PORT || 4000;

async function start() {
  await init();

  // Director demo
  const director = await User.findOne({ where: { email: 'director@school.test' } });
  if (!director) {
    const hash = await bcrypt.hash('directorpass', 10);
    await User.create({
      nombre: 'Director',
      apellidoP: 'Demo',
      apellidoM: '',
      email: 'director@school.test',
      passwordHash: hash,
      role: 'director'
    });
    console.log('✅ Director demo creado');
  }

  // Profesor demo
  const teacher = await User.findOne({ where: { email: 'teacher@school.test' } });
  if (!teacher) {
    const hash = await bcrypt.hash('teacherpass', 10);
    await User.create({
      nombre: 'Profesor',
      apellidoP: 'Demo',
      apellidoM: '',
      email: 'teacher@school.test',
      passwordHash: hash,
      role: 'teacher'
    });
    console.log('✅ Profesor demo creado');
  }

  app.listen(PORT, () => console.log(`🚀 Server corriendo en puerto ${PORT}`));
}

start();
