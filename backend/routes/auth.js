const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Register (no grade/group)
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastP, lastM, email, password, role } = req.body;
    if (!firstName || !lastP || !email || !password) return res.status(400).json({ error: 'Faltan campos' });

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email ya registrado' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: firstName + ' ' + lastP,
      firstName,
      lastP,
      lastM: lastM || '',
      email,
      passwordHash: hash,
      role: role === 'director' ? 'director' : 'teacher',
      driveFolderId: null
    });

    res.json({ success: true, user: { id: user.id, email: user.email, firstName: user.firstName } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Error al registrar' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Faltan campos' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, role: user.role, user: { id: user.id, firstName: user.firstName, lastP: user.lastP, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

module.exports = router;
