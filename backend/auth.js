const express = require('express');
const router = express.Router();
const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// ----- LOGIN -----
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: 'Contraseña incorrecta' });

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });
  res.json({ token });
});

// ----- REGISTER (nuevo usuario) -----
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Verificar si ya existe
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: 'Email ya registrado' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash: hash, role: 'profesor' });

    // Crear carpeta del profesor para uploads
    const uploadDir = path.join(__dirname, '../uploads', `${user.id}`);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    res.status(201).json({ message: 'Usuario registrado correctamente', user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error en el registro' });
  }
});

module.exports = router;
