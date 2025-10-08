const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { User } = require('../models');
const { generateToken, authMiddleware } = require('../auth');

// === Registro ===
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Faltan datos' });

    if (!['teacher', 'director'].includes(role))
      return res.status(400).json({ error: 'Rol inválido' });

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'El correo ya está registrado' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash: hash, role });

    res.json({
      token: generateToken(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// === Login ===
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    res.json({
      token: generateToken(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// === Información del usuario autenticado ===
router.get('/me', authMiddleware, async (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role
  });
});

// === Obtener todos los usuarios (solo director) ===
router.get('/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'director') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role']
    });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

module.exports = router;
